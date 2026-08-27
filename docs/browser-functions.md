# Browser functions

Import the browser namespace with:

```js
const browserFn = require('zerodep/browser/fn');
```

It exports all 84 [common functions](common-functions.md) plus the 38 functions below. Loading the module through CommonJS does not immediately require a DOM, but invoking these functions may require `window`, `document`, `Node`, `CustomEvent`, `URL`, `FormData`, `CSSStyleRule`, `TextEncoder`, `TextDecoder`, `btoa`, or `atob`.

Functions described as **method-bound** call sibling exports through `this` and should be invoked from the namespace object.

## Events, matching, and element relationships

| Export | Observed behavior |
| --- | --- |
| `newWindowScroll()` | Dispatches a bubbling, cancelable `window-scroll` `CustomEvent` on `window`. Its detail reads `posX` and `posY` from a global `scrollSpy` when that global exists, otherwise uses `null`. |
| `newTemplateData(element, data)` | Dispatches a non-bubbling, cancelable `new-data` event with `{ data }` detail. Returns `undefined` and does nothing for a falsy element. |
| `itemFoundInString(stringToSearch, regexList)` | Builds a regular expression from each unescaped list item and returns whether any pattern occurs between string boundaries or whitespace. Invalid patterns throw; untrusted patterns control regex behavior. |
| `itemFoundInTokenList(tokenListToSearch, termsList)` | Returns whether a DOMTokenList-like object contains any supplied term. Returns `false` for a missing token list or non-array terms. |
| `nodeAction(element, eventNodes, filterMode)` | Matches an element against event-node property constraints. Function constraints receive the element property; object constraints compare one level strictly; primitive constraints compare strictly. Returns `true` in filter mode, otherwise invokes `eventNode.action(element)` when present. |
| `nodeFilter(element, eventNodes)` | **Method-bound.** Calls `nodeAction` in filter mode. |
| `isElementHidden(element)` | Returns whether `offsetParent` is `null`; this also classifies some non-rendered or specially positioned elements according to browser behavior. |
| `isDescendant(node, element)` | Walks from `element.parentNode` upward and compares with loose equality. An element is not considered its own descendant. |
| `filterDescendants(node, nodeList)` | **Method-bound.** Returns an array containing list items for which `isDescendant` is true; returns `null` for missing arguments. |

## Scrolling and visibility

| Export | Observed behavior |
| --- | --- |
| `simulateVerticalScroll(element)` | Calls `scrollBy` twice by one pixel in opposite directions, choosing order from `scrollTop`. It can trigger scroll events while intending to preserve position. |
| `simulateHorizontalScroll(element)` | Horizontal form of `simulateVerticalScroll`, choosing order from `scrollLeft`. |
| `isElementScrollableVertically(element)` | Returns a truthy element check when `scrollHeight > offsetHeight + 1`, using one-pixel tolerance. |
| `isElementScrollableHorizontally(element)` | Returns a truthy element check when `scrollWidth > offsetWidth + 1`. |
| `isElementScrollStart(element)` | **Method-bound.** Tests vertical start correctly but compares `scrollWidth === 0` for horizontal start instead of `scrollLeft === 0`; see [known defects](known-defects.md#horizontal-scroll-start-checks-width-instead-of-position). |
| `isElementScrollEnd(element)` | **Method-bound.** Returns whether a vertically or horizontally scrollable element is at or beyond its calculated end. |
| `getElementInView(elements)` | **Method-bound.** Returns the first element fully inside the viewport, `false` if none, or `null` for missing input. |
| `isElementInView(element)` | Requires the complete bounding rectangle to fit within the viewport dimensions. Partially visible elements return `false`. |
| `getElementInViewOf(frame, elements)` | **Method-bound.** Returns the first element whose complete rectangle fits in `frame`, `false` if none, or `null` for missing arguments. |
| `isElementInViewOf(frame, element)` | Compares complete element and frame bounding rectangles without accounting for clipping ancestors or transforms beyond returned geometry. |

## Traversal, classes, and queries

| Export | Observed behavior |
| --- | --- |
| `addClassUntilMultipleSiblings(element, className, followLink)` | **Method-bound and mutating.** Descends through first children, adding a class. At the first child with siblings, also classes that child, optionally clicks its first link, and returns `false`; otherwise returns `undefined`. |
| `removeClassInCollection(collection, className, includeDescendants)` | **Method-bound and mutating.** Iterates enumerable keys with `for...in`, removes the class where `classList` exists, and recursively processes `.children` when requested. |
| `getCurrentScope(source, selector)` | Walks ancestors and returns the first ancestor for which `querySelector(selector)` is truthy. The matching descendant is queried twice and the source itself is included. |
| `getDocumentElement(selector)` | Returns `document.querySelector(selector)`. |
| `getDocumentElements(selector)` | Returns `document.querySelectorAll(selector)`. |
| `getHopsToTheWindow(element)` | Counts parent links until `window.document` is reached. Returns `undefined` for falsy input and can loop into a null dereference when the node is not connected to that document. |
| `getElementSiblings(element, filter, filterArg)` | Starts at the parent's first child, excludes the initial element, includes only element nodes, and optionally applies `filter(element, filterArg)`. |
| `getPreviousSiblings(element, filter, filterArg)` | Walks previous siblings nearest-first, returning only element nodes accepted by the optional filter. |
| `getNextSiblings(element, filter, filterArg)` | Walks next siblings nearest-first, returning only element nodes accepted by the optional filter. |
| `getAllElementSiblings(element, filter, filterArg)` | Walks all element children of the parent, including the supplied element itself. Despite its name, it differs from `getElementSiblings` by not excluding the initial element. |
| `addClassInCollection(collection, className)` | Adds a class to enumerable collection members exposing `classList`. The source labels this function “not used.” |
| `containsSelector(element, selector)` | Returns `true` when `querySelector` finds a descendant, otherwise `false`. The source labels this function “not used.” |
| `containsClass(element, className)` | Returns `true` only when `className` is truthy on the element and `classList.contains` succeeds. |

## URLs, forms, scripts, and styles

| Export | Observed behavior |
| --- | --- |
| `isSameOrigin(url)` | Resolves `url` with `new URL(url)` and compares its origin with `window.location.origin`. Relative URLs throw because no base is supplied. |
| `adjustUrlPathSegment(url, pathSegment, replacement, prependIfNoMatch = true)` | Requires a `RegExp`, modifies a URL pathname according to custom replacement/prepend rules, and returns `href`. Stateful/global regexes and replacement metacharacters retain native regex semantics. The source marks this function for revision. |
| `getHash(url)` | Returns the substring from the final `#`, `null` when no fragment exists, and `false` for falsy input. It does not use URL parsing. |
| `formDataToObject(formData)` | Returns `Object.fromEntries(formData)`; duplicate form names collapse to the last value. |
| `loadScript(url)` | Creates an asynchronous `<script>`, appends it to `document.body`, and resolves/rejects from load/error events. It does not remove the element or apply integrity, nonce, or origin policy. |
| `getStylesheetSelectorProperty(selector, property)` | Intended to find a CSS rule property, but returns only from nested `forEach` callbacks and therefore the outer function always returns `undefined`; stylesheet access can also throw security exceptions. See [known defects](known-defects.md#stylesheet-property-lookup-discards-its-result). |
