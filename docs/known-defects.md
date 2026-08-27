# Known defects and operational risks

This inventory records defects and material limitations visible in the implementation reviewed for this documentation. The project has no test suite, so entries based only on source inspection are identified as such. Direct runtime checks were limited to the package-root import and `treeViewArray` failures.

## Packaging and API defects

### The declared package root does not exist

**Directly confirmed.** `package.json` declares `"main": "index.js"`, but the repository contains no root `index.js`. Consequently:

```js
require('zerodep');
```

throws `MODULE_NOT_FOUND`. Consumers must currently import explicit subpaths. This also means the package has no single authoritative aggregate export.

### `treeViewArray` cannot process a non-empty array

**Directly confirmed.** `treeViewArray` is an arrow function that calls `this.mergeDeep`. Its lexical `this` refers to the original CommonJS export object, which does not receive the later object assigned to `module.exports`. A non-empty input reaches that call and throws:

```text
TypeError: this.mergeDeep is not a function
```

An empty array avoids the callback and resolves to `{}`.

### Method extraction changes behavior

**Source-inspected.** Numerous ordinary methods call sibling functions through `this`, including context matching, deep object operations, string matching, query handling, Base64 variants, and browser helpers. Destructuring such methods loses their namespace receiver:

```js
const { clone } = require('zerodep/js/fn');
clone(value); // this.get is unavailable
```

The package neither binds methods nor documents a stable receiver contract in code.

### Return and error contracts are inconsistent

**Source-inspected.** Depending on the function and invalid input, APIs return `false`, `null`, `undefined`, an empty string, an empty object, or a promise; throw native errors; log and suppress errors; or terminate the process. These differences are documented per entry but no package-wide policy exists.

## Common-function defects

### `setDeep` can throw after a failed traversal

**Source-inspected.** The intermediate `reduce` catches a property-access failure and returns `undefined`, but the final statement assigns through `target[key]` without checking `target`. Invalid or nullish intermediate state can therefore still throw after the apparent recovery path.

### Unicode point conversion is not code-point safe

**Source-inspected.** `stringToDecimalUnicodePoints` iterates strings by code point with `Array.from` but records `char.charCodeAt(0)`, which returns only the leading UTF-16 surrogate for an astral character. `decimalUnicodePointsToString` uses `String.fromCharCode`, which cannot reconstruct values above U+FFFF. The names promise decimal Unicode points more broadly than the implementation supports.

### Base64 is inconsistent between Node.js and browsers

**Source-inspected.** `base64` uses UTF-8 bytes through `TextEncoder` when `window` exists, but uses `Buffer.from(string, 'binary')` otherwise. Non-ASCII strings therefore encode differently across environments. `base64url` and `base64mime` inherit this difference.

### Query parsing decodes separators too early

**Source-inspected.** `parseQueryString` calls `decodeURIComponent` on the complete query before splitting on `&`, `=`, and commas. Encoded separators such as `%26`, `%3D`, and `%2C` become structural delimiters and can change the parsed key/value layout. `queryStringify` performs no corresponding percent encoding.

### `search` can loop forever with a matching non-global regex

**Source-inspected.** `search` repeatedly calls `regex.exec(string)` until it returns `null`. A non-global/non-sticky regular expression that matches returns the same match each time because `lastIndex` does not advance.

### `sleep` may return before its requested duration

**Source-inspected.** The busy-wait is bounded by 10,000,000 loop iterations rather than solely by elapsed time. On a fast runtime or with a large requested delay, the iteration limit can end the function early. It blocks the JavaScript thread while running.

### `generateUUID` is not cryptographically secure

**Source-inspected.** The version-4-shaped identifier uses timestamps and `Math.random`, not a cryptographic random source. It must not be described as suitable for security-sensitive identifiers.

### Encoding names exceed their implemented contracts

**Source-inspected.** `base16` and quoted-printable operate primarily on UTF-16 code units rather than a consistently defined byte encoding. Several decoders validate shape but not canonical trailing bits or complete MIME requirements. These are utility-specific formats, not complete standards implementations.

### Quoted-printable decoding rejects valid digit-only escapes

**Source-inspected.** `decodeQuotedPrintable` attempts to detect lowercase hexadecimal with `/=([0-9a-f]{2})/`. Because the class also contains digits, valid escapes such as `=20` match and cause a `SyntaxError`, even though they contain no lowercase hexadecimal letters.

## Browser defects

### Horizontal scroll start checks width instead of position

**Source-inspected.** `isElementScrollStart` tests:

```js
element.scrollWidth === 0
```

for the horizontal branch. A horizontal scroll position is represented by `scrollLeft`; a scrollable element normally has nonzero `scrollWidth`, so the horizontal-start branch does not report the intended state.

### Stylesheet property lookup discards its result

**Source-inspected.** `getStylesheetSelectorProperty` returns the property only from a nested `forEach` callback. Returning from that callback does not return from the outer function, so the exported function always reaches its end and returns `undefined`. Accessing cross-origin stylesheet rules may additionally throw a security exception that is not handled.

### DOM traversal assumes connected nodes

**Source-inspected.** `getHopsToTheWindow` loops until an element equals `window.document` without stopping at `null`. Detached nodes or nodes from another document can reach a null property access rather than returning an absence result.

## Node and loader defects

### Password hash verification does not validate its record

**Source-inspected.** `isMatchPasswordHash` assumes a valid `salt:hexKey` record and a key of exactly the scrypt output length. `timingSafeEqual` throws on differing buffer lengths, and that throw occurs inside an asynchronous callback without an explicit `try/catch` that rejects the promise. Malformed stored values can therefore produce unpredictable error propagation.

### The JS loader selects `.mjs` but uses `require`

**Source-inspected.** `node/load/js` classifies `.mjs` as loadable and then passes it to synchronous CommonJS `require`. Native ES modules generally require dynamic `import()` and can be rejected by this path.

### JSON key prefixing can overwrite legitimate data

**Source-inspected.** The JSON reviver renames every own property matching an `Object.prototype` name by prefixing `_`. If the prefixed key already exists, it can be overwritten. The transformation is silent and cannot round-trip all valid JSON objects.

### Access-point resolution is broader than its extension check

**Source-inspected.** `node/access` uses the presence of any `.js`, `.mjs`, or `.json` filename to decide to `require` a directory. Node's directory resolution then independently selects the actual entry point. Presence of a matching file does not guarantee that requiring the directory succeeds or loads that file.

## Filesystem and execution risks

### `removeDirContent` does not safely clear a tree

**Source-inspected.** It removes regular files but leaves directories, follows links through `statSync`, and recursively treats every non-file entry as a directory. It does not remove visited directories or establish a traversal boundary. This behavior can leave content behind or traverse an unintended target.

### Download can leave partial output

**Source-inspected.** `download` opens the destination before validating HTTP status or body availability and writes directly to the final path. A network or stream failure can leave a partial file, and parent directories are not created.

### Symbolic-link helpers use weak equivalence checks

**Source-inspected.** `linkDir` considers a directory already linked when any selected index file has equal content, without confirming that the destination is a link to the requested target or that the complete trees agree. Both link helpers log many failures instead of exposing a reliable result.

### `exec` builds an unescaped shell command

**Source-inspected.** `node/exec` concatenates arguments into one string for `child_process.exec` and only adds double quotes when a space occurs after index zero. It does not escape quotes, shell operators, substitutions, newlines, or platform-specific metacharacters. Untrusted input can alter the command and argument boundaries.

### Action dispatch permits path redirection

**Source-inspected.** `node/action` takes path segments from command-line arguments and resolves them from `process.env.PWD` without rejecting absolute paths or `..`. It checks only existence before sending the candidate to `node/exec`. Requiring the module also mutates `process.argv`, can execute code, and can call `process.exit(1)`.

## Revision priorities

Before declaring compatibility or API stability, the highest-value revision work is:

1. define or remove the root entry point;
2. establish supported public entry points and status labels;
3. add behavioral tests for every documented family;
4. fix command/path boundaries and destructive filesystem behavior;
5. normalize error, absence, mutation, and async contracts;
6. correct environment-dependent encodings and confirmed browser/common defects;
7. define supported Node.js and browser versions after the revised implementation is verified.
