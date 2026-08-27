# Action dispatch and command execution

These entry points execute code or shell commands. They are not safe boundaries for untrusted arguments.

## Command executor

```js
const exec = require('zerodep/node/exec');
const exitCode = await exec('node', 'script.js', 'argument');
```

### `exec(...args)`

`node/exec`:

1. Reduces arguments into one command string.
2. Wraps an argument in double quotes only when `arg.indexOf(' ') > 0`.
3. Passes the resulting string to Node.js `child_process.exec`, which invokes a shell.
4. Pipes child stderr and stdout to the parent streams.
5. Resolves a promise with the child's close code.

It does not reject for a nonzero command exit, expose the child process, handle the `error` event, or provide execution options. Arguments are assumed to have an `indexOf` method. Quotes, shell operators, substitutions, newlines, leading-space values, and platform-specific metacharacters are not escaped, so argument boundaries and commands can be changed by input. See [known defects](known-defects.md#exec-builds-an-unescaped-shell-command).

The file has a Node.js shebang, but requiring it returns the executor function and does not immediately execute a command.

## Action dispatcher

The action entry point executes immediately when required or run:

```sh
node ./node_modules/zerodep/node/action <arguments...>
```

An optional namespace can be embedded in the configured path, as suggested by the source comments:

```json
{
  "scripts": {
    "action": "node ./node_modules/zerodep/node/action actions"
  }
}
```

### Dispatch order

After removing the Node executable and action-script arguments, `node/action` reads the working root from `process.env.PWD` and tries the remaining arguments in this order:

1. `/<namespace>/<verb>/<subject>` from the first three arguments;
2. `/<verb>/<subject>` from the first two arguments;
3. `/<verb>/index.js` from the first argument.

The deepest existing candidate is executed with:

```text
node <resolved-candidate> <remaining-arguments...>
```

The module exports the promise returned by that execution. When no candidate exists, it prints a fatal message and calls `process.exit(1)`.

### Operational limitations

- Merely requiring `zerodep/node/action` consumes and mutates `process.argv`, may execute another script, and may terminate the process.
- Resolution trusts `process.env.PWD` rather than `process.cwd()`; `PWD` can be absent, stale, or externally controlled.
- Existence is checked without requiring a regular file, supported extension, or boundary beneath an intended action root.
- Path segments come directly from command-line arguments and are resolved by `path.resolve`; `..` and absolute segments can redirect lookup outside the nominal action tree.
- Execution delegates to the shell-string behavior of `node/exec`, so forwarded arguments are not safely escaped.
- Candidate scripts run with the current process user's authority.

Because of these properties, use requires a trusted action tree and trusted command-line arguments. The current implementation does not enforce those trust boundaries.
