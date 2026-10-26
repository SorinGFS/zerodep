'use strict';
// Run native worker script entries across lazily created worker threads.
const os = require('node:os');
const { Worker, parentPort } = require('node:worker_threads');

// Recreate a worker-reported failure and its causal chain.
const errorFromWorker = (payload) => {
    const cause = payload.cause === undefined ? undefined : errorFromWorker(payload.cause);
    const error = cause === undefined ? new Error(payload.message) : new Error(payload.message, { cause });
    error.name = payload.name;
    if (typeof payload.stack === 'string') error.stack = payload.stack;
    return error;
};

// Serialize a thrown value for native worker-message transport.
const errorForMessage = (error) => ({
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    cause: error instanceof Error && error.cause !== undefined ? errorForMessage(error.cause) : undefined,
    stack: error instanceof Error ? error.stack : undefined,
});

// Schedule one task per worker within Node's reported parallelism.
class Hub {
    #limit = os.availableParallelism();
    #draining = false;

    // Retain the native worker script entry and referenced startup configuration separately from task lifecycle state.
    constructor(entry, options) {
        this.entry = entry;
        this.options = options;
        this.workers = new Set();
        this.idle = [];
        this.queue = [];
        this.closed = false;
        this.closePromise = undefined;
        this.nextId = 1;
    }

    // Report started workers or queued work.
    get live() { return !this.closed && (this.workers.size > 0 || this.queue.length > 0); }

    // Remove a thread from idle service without replacing it before its exit event.
    removeIdle(worker) {
        const index = this.idle.indexOf(worker);
        if (index >= 0) this.idle.splice(index, 1);
    }

    // Assign an already selected task and let native postMessage clone its payload.
    dispatch(worker, task) {
        worker.busy = task;
        try {
            worker.postMessage({ id: task.id, payload: task.payload });
        } catch (error) {
            worker.busy = undefined;
            task.reject(error);
            if (this.workers.has(worker) && !this.closed) this.idle.push(worker);
        }
    }

    // Create a bootstrap worker only for a waiting task while capacity remains available.
    start(task) {
        let worker;
        try {
            // Pass the native script entry and startup data directly to Worker.
            worker = new Worker(this.entry, { workerData: this.options });
        } catch (error) {
            task.reject(error);
            return;
        }
        worker.busy = undefined;
        this.workers.add(worker);
        // Settle only the matching task before returning the worker to FIFO idle service.
        worker.on('message', (message) => {
            const assigned = worker.busy;
            if (!assigned || message?.id !== assigned.id) return;
            worker.busy = undefined;
            if (message.error !== null) assigned.reject(errorFromWorker(message.error));
            else assigned.resolve(message.result);
            if (this.workers.has(worker) && !this.closed) this.idle.push(worker);
            this.drain();
        });
        // Retire a failed worker, but wait for exit before demand can replace its capacity.
        worker.on('error', (error) => {
            worker.failure = error;
            this.removeIdle(worker);
            if (worker.busy) {
                worker.busy.reject(error);
                worker.busy = undefined;
            }
        });
        // Release retiring capacity and reject a task interrupted without an error event.
        worker.on('exit', (code) => {
            if (!this.workers.delete(worker)) return;
            this.removeIdle(worker);
            if (worker.busy) {
                worker.busy.reject(worker.failure ?? new Error('Worker exited with code ' + code + '.'));
                worker.busy = undefined;
            }
            if (!this.closed) this.drain();
        });
        if (this.closed) {
            task.reject(new Error('Hub is closed.'));
            return;
        }
        this.dispatch(worker, task);
    }

    // Dispatch FIFO tasks to idle workers or create only the capacity currently demanded.
    drain() {
        if (this.#draining) return;
        this.#draining = true;
        try {
            // Pair waiting tasks with reusable threads before growing capacity.
            while (!this.closed && this.queue.length) {
                const worker = this.idle.shift();
                if (worker) {
                    this.dispatch(worker, this.queue.shift());
                    continue;
                }
                if (this.workers.size >= this.#limit) return;
                this.start(this.queue.shift());
            }
        } finally {
            this.#draining = false;
        }
    }

    // Queue one payload for native dispatch-time cloning.
    pass(payload) {
        return new Promise((resolve, reject) => {
            if (this.closed) return reject(new Error('Hub is closed.'));
            this.queue.push({ id: this.nextId++, payload, resolve, reject });
            this.drain();
        });
    }

    // Reject every outstanding task once while concurrent callers share thread termination.
    close() {
        if (this.closePromise) return this.closePromise;
        this.closed = true;
        const error = new Error('Hub is closed.');
        // Reject waiting tasks in submission order without repeatedly shifting the queue.
        for (const task of this.queue) task.reject(error);
        this.queue.length = 0;
        // Reject dispatched work before requesting native thread termination.
        for (const worker of this.workers) {
            if (worker.busy) {
                worker.busy.reject(error);
                worker.busy = undefined;
            }
        }
        // Let a synchronous Worker constructor finish before collecting its tracked thread.
        this.closePromise = Promise.resolve().then(() => {
            const workers = [...this.workers];
            this.workers.clear();
            this.idle.length = 0;
            return Promise.all(workers.map((worker) => worker.terminate())).then(() => undefined);
        });
        return this.closePromise;
    }
}

// Register an explicit worker-side task function on the native parent port.
const response = (fn) => {
    if (typeof fn !== 'function') throw new TypeError('Hub response requires a function.');
    if (!parentPort) throw new Error('Hub response requires a parent port.');
    // Handle each task independently while awaiting its function result.
    parentPort.on('message', async ({ id, payload }) => {
        try {
            const result = await fn(payload);
            parentPort.postMessage({ id, result, error: null });
        } catch (error) {
            parentPort.postMessage({ id, result: undefined, error: errorForMessage(error) });
        }
    });
};

module.exports = { Hub, response };
