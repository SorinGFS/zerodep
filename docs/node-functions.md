# Node functions

Import the Node function namespace with:

```js
const nodeFn = require('zerodep/node/fn');
```

It exports every [common function](common-functions.md) plus the four exports below. The common encoding functions may use Node.js `Buffer` when `window` is absent.

| Export | Observed behavior |
| --- | --- |
| `getPasswordHash(password)` | Returns a promise. Generates a random 16-byte hexadecimal salt, derives 64 bytes with `crypto.scrypt`, and resolves to `salt:hexKey`. A scrypt error rejects, although the callback also attempts to resolve afterward. Parameters use Node.js defaults and are not encoded into the stored string. |
| `isMatchPasswordHash(password, hash)` | Returns a promise that splits `hash` at `:`, derives 64 bytes with `crypto.scrypt`, and compares with `crypto.timingSafeEqual`. Malformed hexadecimal or a key of the wrong length can throw inside the asynchronous callback instead of rejecting predictably; see [known defects](known-defects.md#password-hash-verification-does-not-validate-its-record). |
| `btoa(decoded)` | Legacy unpadded Base64 helper. Arrays are joined with commas before `Buffer` encoding; other values are encoded using `binary`/Latin-1 semantics. This differs from the common `base64` contract and removes all trailing padding. |
| `atob(b64Encoded)` | Legacy helper returning a UTF-8 string from `Buffer.from(input, 'base64')`. Node's tolerant Base64 parser is used without explicit validation. |

The source comments state that common `base64` is intended eventually to replace these legacy `btoa` and `atob` exports, but no deprecation mechanism or removal version is defined.
