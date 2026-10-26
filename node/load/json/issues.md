# JSON loader issues

Open issues in `index.js`. UTF-8 reading comes from `../../fs/index.js`; `hasJsonProblematicChars` comes from `../../../js/fn/index.js` via `../../fn/index.js`.

## 1. Reject malformed UTF-8 before parsing

Current UTF-8 reads replace malformed bytes with U+FFFD rather than rejecting them. Bytes `22 C3 28 22` consequently parse as `"\uFFFD("` instead of failing. Decode bytes with fatal UTF-8 validation before `JSON.parse`; do not reject legitimate U+FFFD content.

Acceptance: `22 C3 28 22` must fail decoding; valid UTF-8 `22 EF BF BD 22` must parse as the one-character string U+FFFD.

## 2. Use JSON grammar instead of the broad character filter

`hasJsonProblematicChars` rejects literal U+2028/U+2029 and DEL/C1 (U+007F–U+009F), even inside JSON strings where they are permitted. Escaped equivalents pass the filter. For example, literal U+2028 bytes `22 E2 80 A8 22` are rejected, but escaped ASCII bytes `22 5C 75 32 30 32 38 22` pass.

Acceptance: both examples must parse to the same one-character U+2028 string. Repeat literal/escaped equivalence for U+2029, U+007F, U+0080 and U+009F. Unescaped U+0000–U+001F inside strings must still fail JSON parsing. Let JSON grammar determine JSON validity after strict decoding.

## 3. Accept an optional leading UTF-8 BOM consistently

Bytes `EF BB BF 74 72 75 65` are BOM-prefixed `true`. The current UTF-8 read retains U+FEFF, so `JSON.parse` throws; `new TextDecoder('utf-8', { fatal: true })` strips the leading BOM by default and yields `true`. Accepting an optional leading UTF-8 BOM is the intended consistency policy, not a JSON grammar mandate. A BOM is not malformed UTF-8.

Acceptance: `74 72 75 65` and `EF BB BF 74 72 75 65` must both parse as boolean `true`; BOM-prefixed malformed bytes `EF BB BF 22 C3 28 22` must still fail decoding. Preserve U+FEFF inside strings (`22 EF BB BF 22`).

When fixes land, add these acceptance cases to the loader tests and update these reminders.
