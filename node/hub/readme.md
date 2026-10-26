# Hub worker tasks

`zerodep/node/hub` exports `{ Hub, response }` for independent tasks on persistent native [Node.js worker threads](https://nodejs.org/api/worker_threads.html). Choose Hub for CPU-heavy JavaScript that should run on other threads. It creates workers on demand, reuses them, queues excess work, and provides a promise for each task. Hub centralizes worker management and replies; you still await `hub.close()` when finished.

[`Promise.all()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) waits for promises you give it; it does not move synchronous JavaScript onto other threads. It complements Hub by gathering `hub.pass()` promises. Prefer ordinary asynchronous Node.js APIs and `Promise.all` for routine I/O; use a raw `Worker` when you need a custom lifecycle or message protocol. Use substantial tasks or batches: worker startup and message cloning can outweigh the benefit of tiny jobs.

## How tasks flow

The application and worker have different responsibilities:

- **Application:** create a hub pointing to a worker script, then call `hub.pass(payload)` for each task. Each call returns a promise for that task's result.
- **Worker:** call `response(fn)` once during script startup to supply the function that answers tasks. This setup does not execute `fn`. When a task arrives, `fn` receives only its payload and computes a result, returning either a value or a promise. It can also throw or return a promise that rejects.

Hub handles the reply: the corresponding application promise resolves with the returned result or rejects with the task error. The function stays in the worker; data crosses the thread boundary, including startup options, task payloads, results, and errors. Each worker runs the script once at startup and reuses the supplied function for later tasks. Return explicit results rather than expecting ordinary worker-local changes to update the application.

## Run a task with startup configuration

Install `zerodep` in your application. Use a Node.js runtime that provides native [worker threads](https://nodejs.org/api/worker_threads.html) and [`os.availableParallelism()`](https://nodejs.org/api/os.html#osavailableparallelism).

Place `app.cjs` and `task-worker.cjs` together in your application directory, then run `node app.cjs`. Here, `{ factor: 2 }` is startup configuration available in the worker as native `workerData`; each `pass()` supplies a separate value to multiply. Multiplication is only an illustration of the task flow, not a workload that needs threads.

**`app.cjs`**

```javascript
const { Hub } = require('zerodep/node/hub');

async function main() {
    const hub = new Hub(require.resolve('./task-worker.cjs'), { factor: 2 });
    try {
        const results = await Promise.all([hub.pass(1), hub.pass(2), hub.pass(3)]);
        console.log(results); // [ 2, 4, 6 ]
    } finally {
        await hub.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
```

**`task-worker.cjs`**

```javascript
const { response } = require('zerodep/node/hub');
const { workerData: options } = require('node:worker_threads');

response((value) => value * options.factor);
```

Expected output:

```text
[ 2, 4, 6 ]
```

`Promise.all` preserves result order corresponding to its input promises, not completion order. Its first rejection does not cancel other tasks; the `finally` block then closes the hub, aborting unfinished work. Await all required work before closing for graceful completion.

## Async functions and error causes

Place `async-app.cjs` and `async-worker.cjs` together in an application directory, then run `node async-app.cjs`. This omits optional startup configuration and demonstrates asynchronous return handling and error transport, not a reason to offload trivial asynchronous work.

**`async-app.cjs`**

```javascript
const { Hub } = require('zerodep/node/hub');

async function main() {
    const hub = new Hub(require.resolve('./async-worker.cjs'));
    try {
        console.log(await hub.pass({ text: 'hello' })); // HELLO
        try {
            await hub.pass({ text: null });
        } catch (error) {
            console.log(error.message); // Cannot transform text
            console.log(error.cause.message); // text must be a string
        }
        console.log(await hub.pass({ text: 'still usable' })); // STILL USABLE
    } finally {
        await hub.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
```

**`async-worker.cjs`**

```javascript
const { response } = require('zerodep/node/hub');

response(async ({ text }) => {
    if (typeof text !== 'string') {
        throw new Error('Cannot transform text', {
            cause: new TypeError('text must be a string'),
        });
    }
    return text.toUpperCase();
});
```

Expected output:

```text
HELLO
Cannot transform text
text must be a string
STILL USABLE
```

A normal task-function failure rejects its task without retiring the worker. Transported causes are ordinary reconstructed `Error` objects, not the original subclasses; see [message and error transport](#message-and-error-transport).

## Contract reference

### Construct a hub

`new Hub(entry, options)` returns a hub.

| Input | Contract |
| --- | --- |
| `entry` | A native Node.js `Worker` script entry, passed directly to `new Worker(entry, { workerData: options })`. Filename strings follow the current-working-directory rules of `Worker`; `require.resolve('./task-worker.cjs')` supplies an absolute filename. URL objects follow native `Worker` URL rules. The entry runs as the worker's script, so it must set up its own task response. |
| `options` | Optional raw native `workerData`, distinct from each payload passed to `hub.pass()`. Omission remains `undefined`; `null`, `false`, `0`, and `''` are preserved. Native cloning failures and shared-memory rules apply. |

The hub retains the supplied startup-data reference. A warm worker retains its startup clone; future workers clone the currently referenced data when created. Ordinary worker-side clone mutations do not update the host configuration; explicit shared memory follows Node's rules.

Construction starts no threads and fixes a private concurrency ceiling from [`os.availableParallelism()`](https://nodejs.org/api/os.html#osavailableparallelism). There is no public worker-count option. First demand starts one worker; further unassigned demand grows capacity up to that ceiling. See [scheduling and state](#scheduling-and-state).

### Define the worker response

Import `response` from the public `zerodep/node/hub` entry and call `response(fn)` once during worker-script startup. See [how tasks flow](#how-tasks-flow) for the task function's inputs and result handling, and [message and error transport](#message-and-error-transport) for value and error limitations.

| Setup detail | Contract |
| --- | --- |
| Return value | `response(fn)` returns `undefined`: this is setup, not a task result. Await the promise returned by `hub.pass(payload)` for the task result. |
| Invalid function | Throws `TypeError('Hub response requires a function.')` if `fn` is not a function. |
| Worker context | Throws `Error('Hub response requires a parent port.')` if there is no worker parent port—for example, in the application's main thread. |

### Submit work

`hub.pass(payload)` returns a promise. It queues one payload, resolving with the task function result or rejecting on task-function, worker-script startup, or transport failure. After closure, it returns a rejected promise with `Hub is closed.`. No per-task cancellation or timeout is provided.

### Read the live flag

`hub.live` returns a boolean. This read-only flag does not test worker health or task progress. It is true while the hub is open and has a tracked worker or queued task; idle workers also keep it true. It is false before first use. Closure clears it immediately, regardless of whether thread termination has completed. It is not a busy count. Other implementation fields and scheduling methods are not an application-facing configuration or statistics API.

### Close the hub

`hub.close()` returns a promise resolving to `undefined`. It abortively closes the hub; it does not drain work. Closure, queued/active task rejection with `Hub is closed.`, and `live === false` take effect immediately. A microtask lets any synchronous worker startup finish before collecting tracked threads and requesting termination. Successful resolution confirms that all requested terminations completed. If a termination rejects, `close()` rejects with the first failure through `Promise.all`; other termination requests continue.

Concurrent and repeated calls return the same promise, including for a never-started hub. A closed hub cannot reopen; create a new instance. Always await cleanup in `finally`. When deliberately aborting tasks, observe their promises to avoid unhandled rejections. See [shutdown and worker failures](#shutdown-and-worker-failures).

## Scheduling and state

Idle workers are reused first; unassigned pending demand starts additional workers only while below the construction-time ceiling. At the ceiling, tasks wait FIFO rather than being rejected as busy. Each worker has at most one hub-assigned task. Starting workers count toward capacity before they are online; serialized draining reserves capacity during synchronous startup, including reentrant submissions.

Workers persist across tasks, retaining their own module state, and warm capacity does not shrink until closure (apart from failed/exited threads). Completion order can differ and task-to-worker affinity is not guaranteed.

The CPU concurrency ceiling is not CPU-percent control or load sampling. It does not bound memory or queue size, guarantee global resource usage across hubs/processes, or promise optimal performance.

Payloads are stored by reference while queued and cloned only at `postMessage` dispatch, not at enqueue. Do not mutate them while waiting. Ordinary cloned objects are independent: worker mutations do not change the host original. Explicit shared-memory values follow Node's shared-memory rules, with no coordination supplied by this hub.

## Message and error transport

Payloads and results use native structured-clone message transport. Functions and other non-cloneable values cannot be sent. Failure to post a payload rejects that task; a non-cloneable task-function result is reported as a task error. Consult [Node's worker-message cloning rules](https://nodejs.org/api/worker_threads.html) for supported values and limits, including shared memory and startup data.

Thrown errors and rejected promises from the task function reject the host task. The worker serializes `Error` name, message, stack, and recursive cause; the host reconstructs ordinary `Error` instances with those fields. Arbitrary custom fields and original prototypes/subclasses are not preserved. Non-`Error` thrown values become error messages through `String(value)`. Causes must form a finite, serializable chain; cyclic causes and values that cannot be stringified are unsupported failure payloads.

## Shutdown and worker failures

Await work first if results are required; `close()` is an abort, not graceful queue draining. A task function that never settles can occupy its worker indefinitely until closure. Consumers should ensure an application-level timeout for operations that risk hanging indefinitely; on expiry, they can request termination by calling `close()` on a Hub dedicated to the operation. Hub has no built-in per-task cancellation or timeout API.

Hub never retries a failed task. A task-function error rejects its task but leaves the worker usable. A missing entry script, a worker-script initialization failure, or an unexpected worker exit including exit code zero rejects its assigned task, if any. Failed workers count toward capacity until they exit. Replacements are started only for other pending tasks, not to maintain idle capacity. A synchronous native Worker construction failure rejects the task that triggered startup. Correct broken worker scripts; starting another worker does not repair them.

