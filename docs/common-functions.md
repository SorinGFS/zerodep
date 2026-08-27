# Common functions

Import the 84 common exports with:

```js
const fn = require('zerodep/js/fn');
```

`browser/fn` and `node/fn` spread these exports into their own namespace. Functions described as **method-bound** call sibling exports through `this` and should be invoked as `fn.name(...)`. Unless stated otherwise, invalid input generally returns a falsy value rather than throwing. These contracts are source-observed and untested.

## Arrays, types, and context matching

| Export | Observed behavior |
| --- | --- |
| `uniqueArray(array)` | Returns a deduplicated array, or `false` for a non-array. Uses `Set` equality and preserves first occurrence order. |
| `arrayDuplicates(array)` | Returns every occurrence whose index differs from the first equal item; repeated duplicates can appear more than once. Returns `false` for a non-array. |
| `isNumeric(string)` | Uses `parseFloat`, global `isNaN`, and global `isFinite`; coercible non-string values may be accepted. |
| `isPlainObject(object)` | Returns a truthy object check when the prototype is `Object.prototype` or `null`; otherwise returns a falsy value. |
| `isObjectNotArray(object)` | Returns a truthy object check for any non-null, non-array object. The source marks this export for future removal. |
| `isSimpleArray(array)` | Returns `true` when no item has JavaScript type `object`; therefore arrays containing `null`, arrays, or objects are not simple. |
| `includesArrayItems(target, compared)` | Returns whether both arguments are arrays and every `compared` item is included in `target`. |
| `isContextMatch(ctx, match, minMatchKeys = 1)` | Loose-equality shallow subset match; requires at least `minMatchKeys` in `match`. |
| `isExactContextMatch(ctx, match, minMatchKeys = 1)` | Strict-equality form of `isContextMatch`. |
| `isInContextMatch(ctx, match, minMatchKeys = 1)` | **Method-bound.** Matches each key loosely, allows a match-array to contain the context value, or asks whether a context array includes all match-array items. |
| `isInExactContextMatch(ctx, match, minMatchKeys = 1)` | **Method-bound.** Strict-equality form of `isInContextMatch`. |
| `hasContextMatch(ctx, matches, minMatchKeys = 1)` | Returns whether an array of candidate objects contains a loose shallow context match. |
| `hasExactContextMatch(ctx, matches, minMatchKeys = 1)` | Strict-equality form of `hasContextMatch`. |
| `hasContextsMatches(ctx, matches, minMatchKeys = 1)` | **Method-bound.** Checks whether any candidate contains nested objects that all loosely match corresponding context objects. |
| `hasExactContextsMatches(ctx, matches, minMatchKeys = 1)` | **Method-bound.** Strict-equality form of `hasContextsMatches`. |
| `hasInContextsMatches(ctx, matches, minMatchKeys = 1)` | **Method-bound.** Nested candidate matching with the array-membership behavior of `isInContextMatch`. |
| `hasInExactContextsMatches(ctx, matches, minMatchKeys = 1)` | **Method-bound.** Strict-equality form of `hasInContextsMatches`. |
| `treeViewArray(target, parse)` | Intended to reduce an array of parsed objects into a deep merge wrapped in a resolved promise. It currently throws for a non-empty array because its arrow function captures an object without `mergeDeep`; see [known defects](known-defects.md#treeviewarray-cannot-process-a-non-empty-array). |

## JSON, pointers, and nested objects

| Export | Observed behavior |
| --- | --- |
| `hasJsonProblematicChars(string)` | Tests for selected control characters and U+2028/U+2029 with a newly created regular expression on each call. |
| `removeJsonProblematicChars(string)` | Removes the selected characters. Throws if the input has no `replace` method. |
| `escapeJsonProblematicChars(string)` | Replaces selected characters with lowercase `\uXXXX` escapes. |
| `jsonPointer(...keys)` | Converts keys to slash-joined RFC 6901-style tokens by escaping `~` and `/`; it does not add a leading slash. |
| `jsonPointerKeys(jsonPointer)` | Splits on `/` and decodes `~0` and `~1`; malformed tilde sequences remain unchanged. |
| `get(object, ...keys)` | Traverses own or inherited properties and returns the value, or `undefined` when an intermediate value is nullish or a result is `undefined`. |
| `set(value, object, ...keys)` | Mutates missing intermediate keys into objects but preserves an existing primitive intermediate. Returns `true` after assignment, `undefined` on an unusable path, or `value` when no keys are given without mutating the caller's binding. |
| `setDeep(value, object, ...keys)` | Mutates the path, replacing non-object intermediates with objects. A failed traversal can lead to an assignment through `undefined`; see [known defects](known-defects.md#setdeep-can-throw-after-a-failed-traversal). |
| `delete(object, ...keys)` | **Method-bound.** Deletes the final property when the parent resolved by `get` is truthy. It returns `true` for absent or falsy parents and may silently skip valid falsy-valued paths. |
| `clone(object, ...keys)` | **Method-bound.** Recursively copies arrays and enumerable object entries below the path returned by `get`. It does not preserve prototypes, descriptors, cycles, or specialized built-ins. |
| `structuredClone(object, ...keys)` | **Method-bound.** Like `clone`, but sorts each object's entries. It is unrelated to the platform `structuredClone` algorithm. |
| `deepKeys(object)` | **Method-bound.** Collects recursive key fragments, stringifies and splits them by commas, removes numeric-looking values, deduplicates, and sorts. Commas in keys and numeric keys are not preserved faithfully. |
| `mergeDeep(target, ...sources)` | **Method-bound and mutating.** Recursively merges plain objects into `target`; arrays and other values are replaced by the last source. Non-plain sources are ignored. |
| `replaceDeep(parser, object, ...keys)` | Mutates a nested tree. When `parser(value, key)` returns an object, deletes the current item and replaces/merges assignments, then reparses the level. Cycles and repeated self-producing replacements can recurse indefinitely. |
| `replaceDeepKey(keyToParse, parser, object, ...keys)` | `replaceDeep` limited to an exact key or regular-expression match. Stateful regular expressions are not reset. |
| `replaceDeepKeyParent(keyToParse, parser, object, ...keys)` | Replaces the matched key's parent using `parser(parent, parentKey, matchedKey)`. The source names the ancestor variable `granParent`; root matches are skipped. |
| `replaceDeepPath(pathToParse, parser, object, ...keys)` | `replaceDeep` limited to slash-joined paths ending with a string or matching a regular expression. |
| `assignDeep(parser, object, ...keys)` | Mutates every traversed container by merging object results from `parser(value, key)` without deleting the current key. |
| `assignDeepKey(keyToParse, parser, object, ...keys)` | `assignDeep` limited to an exact key or regular-expression match. |
| `assignDeepKeyParent(keyToParse, parser, object, ...keys)` | Assigns parser results into the matched key's parent; root matches are skipped. |
| `assignDeepPath(pathToParse, parser, object, ...keys)` | `assignDeep` limited to matching slash-joined paths. |
| `parseDeep(parser, object, ...keys)` | Traverses object keys and calls `parser(...pathKeys)`. A truthy parser result reparses the same level before descending. |
| `parseDeepKey(keyToParse, parser, object, ...keys)` | Calls the parser only for matching keys while still descending through the complete tree. |
| `parseDeepKeyParent(keyToParse, parser, object, ...keys)` | Calls `parser(...parentPathKeys)` for matching non-root keys and may reparse the grandparent after a truthy result. |
| `parseDeepPath(pathToParse, parser, object, ...keys)` | Calls the parser for string-suffix or regular-expression path matches. |

The replace, assign, and parse families do not detect circular references. Their callbacks can mutate the same tree being traversed, so termination is the caller's responsibility.

## Equality, patterns, searching, and URI references

| Export | Observed behavior |
| --- | --- |
| `areEqualObjects(obj1, obj2)` | Sorts recursively generated entry arrays and compares their JSON text. The source itself describes this method as slow and wrong; cycles and values omitted by JSON are unsupported. |
| `areEqualArrays(arr1, arr2)` | Strict, ordered, shallow array comparison. Returns `false` for non-arrays. |
| `escapeRegex(string)` | Escapes regular-expression metacharacters for literal matching. |
| `globToRegex(globPattern)` | Converts a custom glob/extglob-like string into a regex source string ending in `$`; it does not return a `RegExp`. Conversion assumes valid input and supports only the source's custom nesting rules. |
| `regexToGlob(regexPattern)` | Attempts to reverse output created by `globToRegex`; arbitrary regular expressions are not supported. |
| `search(string, regex, parser)` | Repeatedly calls `regex.exec` and invokes `parser(match)` until no match remains. A non-global matching regex or a zero-length match that does not advance `lastIndex` can cause an infinite loop. |
| `stringMatches(string, regex)` | **Method-bound.** Returns an array of all match arrays collected by `search`. |
| `stringCaptureGroupMatches(string, regex)` | **Method-bound and mutating.** Removes each full match with `shift()` and records the first truthy remaining capture. Empty-string captures are skipped. |
| `stringCaptureGroupsOrMatches(string, regex)` | **Method-bound and mutating.** Reverses each match array and records the first truthy value. |
| `relativeUriReference(targetUriReference, base = 'schema:/')` | Produces a decoded relative URI reference using `URL`. Its custom path algorithm is not documented as standards-complete. |

## Query strings and string conversion

| Export | Observed behavior |
| --- | --- |
| `parseQueryString(queryString, asArray)` | **Method-bound.** Decodes the complete input, removes one leading `?`, and parses booleans, `null`, numbers, JSON-looking values, and comma lists. Missing `=` parameters are ignored. Decoding before splitting can misparse encoded separators; malformed percent encoding throws. |
| `queryStringify(object)` | **Method-bound.** Produces a leading-`?` query without percent encoding. Simple arrays become comma lists; objects are JSON-stringified. Returns an empty string for arrays and non-objects. |
| `mergeQueryStrings(initial, upserts)` | **Method-bound.** Parses and shallow-merges two query strings or a query string and object, then stringifies the result. Returns an empty string for invalid shapes and `undefined` for unsupported `upserts`. |
| `stringToDecimalUnicodePoints(string)` | Returns one `charCodeAt(0)` value per `Array.from` item. Despite its name, astral characters yield only their leading UTF-16 surrogate; see [known defects](known-defects.md#unicode-point-conversion-is-not-code-point-safe). |
| `decimalUnicodePointsToString(unicodePoints)` | Joins `String.fromCharCode` results. Values above U+FFFF are truncated rather than passed to `String.fromCodePoint`. |
| `reverseString(string)` | Reverses by `Array.from`, preserving surrogate pairs but not grapheme clusters. |
| `capitalizeFirstLetter(string)` | Uppercases the first code point and appends the remaining `Array.from` items. Empty input throws when `String.fromCodePoint(undefined)` is evaluated. |
| `camelCase(...strings)` | **Method-bound.** Lowercases the first string and lowercases/capitalizes subsequent strings. Throws when no first string is supplied. |
| `prefixOf(...strings)` | Returns the common UTF-16 code-unit prefix. With zero arguments it returns an empty string; with one it returns that value or an empty string. |

## Numeric and timing utilities

| Export | Observed behavior |
| --- | --- |
| `toBigIntScaled(numberString)` | Converts a decimal/scientific-notation string into `[BigInt, nonnegativeScale]`. Invalid exponent or digit syntax can throw. |
| `isMultipleOf(number, divisor)` | **Method-bound.** Uses `maybeMultipleOf`, then decimal-string/BigInt scaling for difficult finite-number cases. Accuracy remains limited by the original IEEE-754 values and their string conversion. |
| `maybeMultipleOf(number, divisor)` | Returns `false` for invalid finite-number inputs or zero divisors, a boolean for supported fast paths, and `undefined` when `isMultipleOf` should use its fallback. |
| `sleep(milliseconds)` | Busy-waits but stops after at most 10,000,000 iterations, so it may return before the requested duration and blocks the event loop while running. |
| `delay(milliseconds)` | Returns a promise resolved by `setTimeout`. |
| `microtime(getAsFloat)` | Returns seconds as a number when requested, otherwise a PHP-like `"fraction seconds"` string. Its clock origin and fractional multiplier differ between `performance.now` and `Date.now`. |
| `generateUUID()` | Produces a version-4-shaped identifier from time and `Math.random`. It is not a cryptographically secure UUID generator. |

## Checksums and encodings

| Export | Observed behavior |
| --- | --- |
| `crc32(r)` | Computes unsigned CRC-32 over `charCodeAt` values. Input is expected to expose `length` and `charCodeAt`. |
| `crc32c(crc, bytes)` | Updates a CRC-32C value over numeric byte entries and returns the signed bitwise result unless callers coerce it unsigned. |
| `crc32DuplexHash(value)` | **Method-bound.** Concatenates unpadded hexadecimal CRC-32 values for `JSON.stringify(value)` and its reversed string. It is not cryptographic and output width can vary. |
| `base16(string)` | Encodes each UTF-16 code unit as uppercase hexadecimal padded to at least two digits; this is not a defined UTF-8 byte encoding. |
| `decodeBase16(encoded)` | Validates uppercase even-length hexadecimal and returns a `Uint8Array` whose overridden `toString()` decodes strict UTF-8 or returns `null`. Lowercase input is rejected. |
| `base32(string)` | Encodes UTF-8 bytes with RFC 4648's uppercase alphabet and `=` padding. Uses `TextEncoder` in a browser and `Buffer` otherwise. |
| `decodeBase32(encoded)` | Validates uppercase padded input, decodes complete 8-bit groups, and returns a `Uint8Array` with strict-UTF-8 `toString()`. Canonical padding bits are not validated. |
| `base64(string)` | Encodes browser input as UTF-8, but Node.js input as `binary`/Latin-1 bytes. Non-ASCII output therefore differs by environment; see [known defects](known-defects.md#base64-is-inconsistent-between-nodejs-and-browsers). |
| `decodeBase64(encoded)` | Validates padded standard Base64, decodes bytes, and returns a `Uint8Array` with strict-UTF-8 `toString()`. Canonical trailing bits are not validated. |
| `base64url(string)` | **Method-bound.** Converts `base64` output to unpadded Base64url and inherits its environment-dependent string encoding. |
| `decodeBase64url(encoded)` | **Method-bound.** Validates Base64url shape, normalizes padding, and delegates to `decodeBase64`. It accepts optional existing `=` padding. |
| `base64mime(string)` | **Method-bound.** Wraps `base64` output at 76 characters using CRLF. |
| `decodeBase64mime(encoded)` | **Method-bound.** Removes CRLF only and delegates to `decodeBase64`; lone-LF MIME wrapping is rejected. |
| `quotedPrintable(string)` | Encodes selected UTF-16 code units and inserts soft breaks every 75 characters. It does not implement complete MIME quoted-printable rules or UTF-8 conversion. |
| `decodeQuotedPrintable(encoded)` | Attempts to reject lowercase hexadecimal escapes, but its check also rejects valid digit-only escapes such as `=20`. It removes soft breaks, decodes bytes, and returns a `Uint8Array` with strict-UTF-8 `toString()`. Literal non-ASCII input is reduced to byte values. |
