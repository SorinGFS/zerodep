# Filesystem and path functions

Import the Node.js filesystem namespace with:

```js
const fileSystem = require('zerodep/node/fs');
```

Most path-taking functions call `path.resolve(...arguments)`, so relative paths are resolved against the process's current working directory. Many operations are synchronous and block the event loop. Mutating functions do not provide transactional rollback.

## Buffers, paths, and directory inspection

| Export | Observed behavior |
| --- | --- |
| `buffersAreEqual(buffer1, buffer2)` | Calls `buffer1.equals(buffer2)` and returns its result. Invalid buffer-like inputs throw. |
| `pathResolve(...args)` | Direct wrapper around `path.resolve`. |
| `pathJoin(...args)` | Direct wrapper around `path.join`. |
| `pathDirName(file)` | Direct wrapper around `path.dirname`. |
| `pathBaseName(file)` | Direct wrapper around `path.basename`. |
| `pathExtName(file)` | Direct wrapper around `path.extname`. |
| `entries(...pathResolveArgs)` | Synchronously returns `fs.readdirSync` names for the resolved directory. |
| `files(...pathResolveArgs)` | Returns names whose `lstatSync` result is a regular file. Symbolic-link targets are not followed for classification. |
| `dirs(...pathResolveArgs)` | Returns names whose `lstatSync` result is a directory. |
| `links(...pathResolveArgs)` | Returns names whose `lstatSync` result is a symbolic link. |
| `test(regex, ...pathResolveArgs)` | Applies the supplied regular expression to the resolved path string. A global/sticky regex retains its `lastIndex` behavior. |
| `exists(...pathResolveArgs)` | Returns `fs.existsSync` for the resolved path. |
| `isFile(...pathResolveArgs)` | Returns whether the path exists and its `lstatSync` result is a file. |
| `isDirectory(...pathResolveArgs)` | Returns whether the path exists and its `lstatSync` result is a directory. |
| `isLink(...pathResolveArgs)` | Returns whether the path exists and its `lstatSync` result is a symbolic link. |
| `isSocket(...pathResolveArgs)` | Returns whether the path exists and its `lstatSync` result is a socket. |

## Filesystem mutation

| Export | Observed behavior |
| --- | --- |
| `link(target, link)` | Creates a symbolic link after comparing file contents and possibly unlinking an existing symbolic link. It delegates directory targets to `linkDir`, logs errors, and does not replace an ordinary destination. Symbolic links are persistent path indirection and should not be treated as portable generated output. |
| `linkDir(target, link)` | Creates a symbolic link for a directory after comparing selected index-file contents. Any one matching index file marks the destination as already linked, even if other content differs. Errors are logged. |
| `unlink(...pathResolveArgs)` | Removes only an existing symbolic-link object. Errors are logged rather than returned or thrown. |
| `chdir(...pathResolveArgs)` | Changes the process-wide working directory with `process.chdir`. This affects every subsequent relative operation in the process. |
| `mkdir(...pathResolveArgs)` | Synchronously creates the resolved directory recursively and returns Node.js's `mkdirSync` result. |
| `readFile(file, options)` | Calls `fs.readFileSync` using `file` directly rather than resolving variadic components. On failure, logs the error and returns `undefined`. |
| `writeFile(file, content, printSuccess = false)` | Refuses to run when `process.env.NODE_ENV` is truthy. Otherwise creates the parent recursively and writes synchronously; failures are logged and suppressed. |
| `appendFile(file, content, printSuccess = false)` | Same restrictions as `writeFile`, but appends synchronously. |
| `removeFile(...pathResolveArgs)` | Removes only an existing regular file. Errors are logged and suppressed. |
| `rename(oldPath, newPath)` | Direct synchronous `fs.renameSync` call without path normalization or error suppression. |
| `removeDir(...pathResolveArgs)` | Recursively removes the resolved path with `fs.rmSync({ recursive: true })`. It is destructive and does not set `force`; missing paths and removal failures throw. |
| `removeDirContent(...pathResolveArgs)` | Recursively unlinks files below a directory but leaves nested directories in place. It uses `statSync`, follows links during classification, suppresses only the initial directory-read error, and can recurse unsafely through non-file entries; see [known defects](known-defects.md#removedircontent-does-not-safely-clear-a-tree). |

## Network, URI mapping, and watching

| Export | Observed behavior |
| --- | --- |
| `download(url, ...pathResolveArgs)` | Fetches `url`, converts the response body to a Node.js readable stream, and pipes it to a write stream at the resolved path. It does not create parents, check HTTP status, validate a missing body, use a temporary file, or remove partial output after failure. |
| `pathResolveArgsFromUri(uriReference, options = {})` | Converts a URL reference into path segments. Options are `base` (default `schema:/`), `pathOnly` (default `true`), `noSchema`, and `subdomainsNested`. It decodes the pathname, maps `:` and backslashes to `/`, and can include protocol, port, hostname, and username segments. Returned segments are not validated for safe filesystem use. |
| `filePathResolveArgs(options, ...pathResolveArgs)` | With a truthy `options.parser`, appends that extension to the last segment when absent; an empty last segment becomes `${index}.${parser}` with default index `index`. It mutates only its local argument array. |
| `watch(...pathResolveArgs)` | Returns `fs.watch` for the resolved path with no options or callback. Consumers must attach listeners and close the watcher. |

## Error model

The module has no unified error contract. Some wrappers throw native errors, while `readFile`, `writeFile`, `appendFile`, `removeFile`, `link`, `linkDir`, and `unlink` log selected errors and return `undefined`. Callers cannot infer success consistently from return values.
