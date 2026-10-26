# zerodep

`zerodep` is a CommonJS collection of dependency-free utilities for shared JavaScript, browser, and Node.js environments. The package includes data and encoding functions, DOM helpers, filesystem operations, recursive loaders, an action dispatcher, and a command executor.

## Install

Install an exact version because the package changes frequently:

```sh
npm i -E zerodep
```

The references cover every current export. They describe observed source behavior rather than a compatibility guarantee. Functions may return different absence indicators (`false`, `null`, or `undefined`), mutate supplied values, log and suppress errors, or rely on host globals; consult each entry before use.

## Tests, benchmarks, and compatibility

Run the public behavioral suite and benchmarks with:

```sh
npm test
npm run benchmark
```
