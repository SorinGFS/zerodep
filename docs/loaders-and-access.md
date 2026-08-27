# Loaders and access points

These Node.js entry points synchronously inspect directories and may execute JavaScript through `require`. Do not use them on untrusted or writable-by-untrusted trees.

## Generic recursive loader

```js
const load = require('zerodep/node/load');
const result = load(loader, directoryOrFile);
```

### `load(loader, ...pathResolveArgs)`

- Returns `undefined` when the resolved path does not exist.
- Calls `loader(...pathResolveArgs)` directly when the path is a file.
- For a directory, recursively visits regular files and directories synchronously.
- Each file loader result is passed to `Object.assign(node, result)`. A result of `null` or `undefined` is tolerated by current `Object.assign` behavior; primitive results generally contribute no useful keys.
- Directory names become object keys.
- Symbolic links are excluded because traversal uses `node/fs.files` and `node/fs.dirs`, both based on `lstatSync`.
- Errors from directory reading or the loader propagate.

The traversal provides no cycle detection beyond excluding symbolic links and does not sort entries independently of the host filesystem's `readdirSync` order.

## JavaScript/module loader

```js
const loadJs = require('zerodep/node/load/js');
const modules = loadJs(directoryOrFile);
```

### `loadJs(...pathResolveArgs)`

Uses the generic loader and accepts filenames ending in `js`, `mjs`, or `json` by a case-sensitive final-segment check. Each accepted file becomes:

```js
{
    [filenameWithoutFinalExtension]: require(absolutePath)
}
```

Consequences:

- JavaScript executes synchronously with full process authority.
- CommonJS `require` caching applies.
- Duplicate base names overwrite earlier assignments.
- `.json` files use Node.js's ordinary JSON loader without the protective key rewriting used by `load/json`.
- `.mjs` is selected but passed to synchronous CommonJS `require`, which commonly rejects ES modules; see [known defects](known-defects.md#the-js-loader-selects-mjs-but-uses-require).
- The source comment incorrectly calls this a JSON loader.

## JSON loader

```js
const loadJson = require('zerodep/node/load/json');
const data = loadJson(directoryOrFile);
```

### `loadJson(...pathResolveArgs)`

Uses the generic loader for files whose extension is exactly lowercase `.json`.

1. Reads UTF-8 text through `node/fs.readFile`.
2. Rejects selected control characters and U+2028/U+2029 with `SyntaxError`.
3. Parses JSON with the `prefixObjectProtoKeys` reviver.
4. Returns an object keyed by the filename without its final extension.

Because `node/fs.readFile` logs and suppresses read failures, a failed read can subsequently cause a type error in the character check rather than preserving the original filesystem error.

### `prefixObjectProtoKeys(key, value)`

This reviver is available at the internal subpath `zerodep/node/load/json/prefixObjectProtoKeys`, although it is not separately advertised by `package.json`.

For each parsed non-array object, it obtains all names from `Object.prototype`. Any own key with the same name is moved to an underscore-prefixed key and deleted, for example `constructor` becomes `_constructor`.

This is a lossy transformation rather than prototype-pollution prevention alone:

- an existing `_constructor` can be overwritten;
- multiple source names can collide with existing prefixed data;
- legitimate keys matching `Object.prototype` are renamed silently;
- the root and every nested object are transformed.

## Access-point builder

```js
const access = require('zerodep/node/access');
const api = access(directory);
```

### `access(...pathResolveArgs)`

Builds a nested object from a directory structure:

- returns `undefined` when the path does not exist;
- for each level containing any filename with a final extension of `js`, `mjs`, or `json`, calls `require` on the directory path and deep-merges that module's export into the current node;
- creates an object for every child directory;
- when a child directory contains an accepted filename, requires that directory and merges its export under the directory name;
- recursively visits directories that themselves contain directories.

The extension check only decides whether to require a directory; Node.js still chooses the actual directory entry according to its module-resolution rules. A matching file that is not a resolvable directory entry can therefore trigger a load attempt that fails. Loaded code executes synchronously, `mergeDeep` mutates the access object, arrays are replaced, and colliding module exports can overwrite earlier values.
