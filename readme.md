# zerodep

`zerodep` is a CommonJS collection of dependency-free utilities for shared JavaScript, browser, and Node.js environments. The package includes data and encoding functions, DOM helpers, filesystem operations, recursive loaders, an action dispatcher, and a command executor.

The documentation describes the implementation shipped by the selected package release. The project does not yet declare supported Node.js or browser versions. Public behavioral tests and benchmarks cover precision-sensitive numeric utilities; behavior identified only by source inspection remains unverified.

## Install

Install an exact version because the package changes frequently:

```sh
npm i -E zerodep
```

## Entry points

The package currently has no working root entry point: `package.json` declares `index.js`, but that file does not exist. Import an explicit CommonJS subpath instead.

| Entry point | Responsibility |
| --- | --- |
| `zerodep/js/fn` | 84 environment-neutral utility exports |
| `zerodep/browser/fn` | All common functions plus browser and DOM helpers |
| `zerodep/node/fn` | All common functions plus password and legacy Base64 helpers |
| `zerodep/node/fs` | Synchronous filesystem/path helpers, downloads, and watchers |
| `zerodep/node/load` | Generic recursive directory loader |
| `zerodep/node/load/js` | Recursive CommonJS-compatible module loader |
| `zerodep/node/load/json` | Recursive JSON loader with key rewriting |
| `zerodep/node/load/json/prefixObjectProtoKeys` | JSON reviver used by the JSON loader |
| `zerodep/node/access` | Builds an object access point from nested modules |
| `zerodep/node/action` | Immediately dispatches an action from command-line arguments |
| `zerodep/node/exec` | Executes a shell command and resolves with its exit code |

```js
const fn = require('zerodep/js/fn');

console.log(fn.uniqueArray([1, 1, 2]));
// [1, 2]
```

```js
const nodeFn = require('zerodep/node/fn');
const fileSystem = require('zerodep/node/fs');
```

Some functions call sibling exports through `this`. Invoke those functions as methods of the imported namespace unless their reference explicitly says otherwise:

```js
const fn = require('zerodep/js/fn');
const value = fn.clone(source, 'nested', 'key');
```

## API reference

- [Common functions](docs/common-functions.md)
- [Browser functions](docs/browser-functions.md)
- [Node functions](docs/node-functions.md)
- [Filesystem and path functions](docs/filesystem.md)
- [Loaders and access points](docs/loaders-and-access.md)
- [Action dispatch and command execution](docs/action-and-exec.md)
- [Known defects and operational risks](docs/known-defects.md)

The references cover every current export. They describe observed source behavior rather than a compatibility guarantee. Functions may return different absence indicators (`false`, `null`, or `undefined`), mutate supplied values, log and suppress errors, or rely on host globals; consult each entry before use.

## Operational safety

Several modules can execute commands, load code, download remote content, mutate the process working directory, overwrite or recursively remove files, and create symbolic links. Validate all paths, URLs, module trees, and command arguments before invoking them. Do not pass untrusted input to `node/action`, `node/exec`, recursive loaders, or mutating filesystem helpers.

## Tests, benchmarks, and compatibility

Run the public behavioral suite and benchmarks with:

```sh
npm test
npm run benchmark
```

Run documentation coverage, tests, and the reduced benchmark smoke workload together with:

```sh
npm run check
```

The public suite currently concentrates on exact `isMultipleOf` behavior across integer, decimal, exponent, subnormal, extreme, invalid, and former epsilon-tolerance cases. The benchmark suite records package-load time and representative integer and arbitrary-precision decimal paths. These suites use the same materialized public-data layout as CI.

Supported Node.js releases and browser baselines are intentionally unspecified pending a broader project revision. The current workflow exercises Node.js 24 and 26 on Linux, Windows, and macOS; this matrix is verification coverage rather than a complete support declaration. The implementation uses features including CommonJS, `BigInt`, `URL`, `TextEncoder`, `TextDecoder`, `fetch`, `replaceAll`, DOM APIs, and Node.js built-ins; availability depends on the selected entry point and runtime.

Documentation coverage remains independently available through:

```sh
npm run check:docs
```

