﻿'use strict';
// https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file
// https://stackoverflow.com/questions/18658755/javascript-file-for-each-html-file
module.exports = {
    newWindowScroll: function () {
        const posX = typeof scrollSpy != 'undefined' ? scrollSpy.posX : null;
        const posY = typeof scrollSpy != 'undefined' ? scrollSpy.posY : null;
        const event = new CustomEvent('window-scroll', {
            bubbles: true,
            cancelable: true,
            detail: {
                scrollPositionX: posX,
                scrollPositionY: posY,
            },
        });
        window.dispatchEvent(event);
    },
    newTemplateData: function (element, data) {
        if (!element) return;
        const event = new CustomEvent('new-data', {
            bubbles: false,
            cancelable: true,
            detail: {
                data: data,
            },
        });
        element.dispatchEvent(event);
    },
    itemFoundInString: function (stringToSearch, regexList) {
        if (!(regexList instanceof Array) || !stringToSearch) return false;
        let pattern;
        for (let i = 0; i < regexList.length; i++) {
            //pattern = RegExp('\\b' + regexList[i] + '\\b');
            pattern = RegExp('(^|\\s)' + regexList[i] + '($|\\s)');
            if (pattern.test(stringToSearch)) return true;
        }
        return false;
    },
    itemFoundInTokenList: function (tokenListToSearch, termsList) {
        if (!(termsList instanceof Array) || !tokenListToSearch) return false;
        for (let i = 0; i < termsList.length; i++) {
            if (tokenListToSearch.contains(termsList[i])) return true;
        }
        return false;
    },
    // test if string is numeric
    isNumeric: (string) => !isNaN(parseFloat(string)) && isFinite(string),
    // test if type is object but not array
    isObjectNotArray: (object) => object && typeof object === 'object' && !Array.isArray(object),
    // test if array and has no object items
    isSimpleArray: (array) => Array.isArray(array) && !array.filter((item) => typeof item === 'object').length,
    // https://gist.github.com/jeneg/9767afdcca45601ea44930ea03e0febf
    // split the object reference by corresponding delimiter and pass the keys array using spread operator
    get: (object, ...refs) => {
        return refs.reduce((node, ref) => {
            try {
                return node[ref];
            } catch (e) {
                return undefined;
            }
        }, object);
    },
    // https://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
    // returns merged objects, array keys are not merged instead the last array wins
    mergeDeep: function (target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        if (this.isObjectNotArray(target) && this.isObjectNotArray(source)) {
            for (const key in source) {
                if (this.isObjectNotArray(source[key]) && !(source[key] instanceof RegExp)) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        return this.mergeDeep(target, ...sources);
    },
    areEqualObjects: function (a, b) {
        let s = (o) =>
            Object.entries(o)
                .sort()
                .map((i) => {
                    if (i[1] instanceof Object) i[1] = s(i[1]);
                    return i;
                });
        return JSON.stringify(s(a)) === JSON.stringify(s(b));
    },
    // for object comparison: https://stackoverflow.com/questions/1068834/object-comparison-in-javascript
    nodeAction: function (element, eventNodes, filterMode) {
        let valid;
        for (const eventNode of eventNodes) {
            valid = true;
            // iterate node properties
            for (const [key, value] of Object.entries(eventNode)) {
                // avoid action key and break on invalid
                if (valid && key !== 'action') {
                    // check if properties exists in both
                    if (element[key]) {
                        switch (typeof value) {
                            case 'function':
                                valid = value(element[key]);
                                break;
                            case 'object':
                                for (const [objKey, objValue] of Object.entries(value)) {
                                    valid = valid && objValue === element[key][objKey];
                                }
                                break;
                            default:
                                valid = value === element[key];
                                break;
                        }
                    } else {
                        valid = false;
                        break;
                    }
                }
            }
            if (valid) {
                if (filterMode) return true;
                return eventNode.action && eventNode.action(element);
            }
        }
        return false;
    },
    nodeFilter: function (element, eventNodes) {
        return this.nodeAction(element, eventNodes, true);
    },
    isElementHidden: function (element) {
        return element.offsetParent === null;
    },
    isDescendant: function (node, element) {
        let item = element.parentNode;
        while (item != null) {
            if (item == node) return true;
            item = item.parentNode;
        }
        return false;
    },
    filterDescendants: function (node, nodeList) {
        if (!nodeList || !node) return null;
        let descendants = [];
        for (let item of nodeList) {
            if (this.isDescendant(node, item)) {
                descendants.push(item);
            }
        }
        return descendants;
    },
    simulateVerticalScroll: function (element) {
        if (element.scrollTop > 0) {
            element.scrollBy(0, -1);
            element.scrollBy(0, 1);
        } else {
            element.scrollBy(0, 1);
            element.scrollBy(0, -1);
        }
    },
    simulateHorizontalScroll: function (element) {
        if (element.scrollLeft > 0) {
            element.scrollBy(-1, 0);
            element.scrollBy(1, 0);
        } else {
            element.scrollBy(1, 0);
            element.scrollBy(-1, 0);
        }
    },
    isElementScrollableVertically: function (element) {
        // return element && element.scrollHeight > element.offsetHeight && !(element.offsetWidth > element.scrollWidth);
        return element && element.scrollHeight > element.offsetHeight + 1; // 1px fault tolerance
    },
    isElementScrollableHorizontally: function (element) {
        return element && element.scrollWidth > element.offsetWidth + 1; // 1px fault tolerance
    },
    isElementScrollStart: function (element) {
        return element && ((this.isElementScrollableVertically(element) && element.scrollTop === 0) || (this.isElementScrollableHorizontally(element) && element.scrollWidth === 0));
    },
    isElementScrollEnd: function (element) {
        return element && ((this.isElementScrollableVertically(element) && element.scrollHeight - element.offsetHeight - element.scrollTop <= 0) || (this.isElementScrollableHorizontally(element) && element.scrollWidth - element.offsetWidth - element.scrollLeft <= 0));
    },
    getElementInView: function (elements) {
        if (!elements) return null;
        for (let element of elements) {
            if (this.isElementInView(element)) {
                return element;
            }
        }
        return false;
    },
    isElementInView: function (element) {
        let rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) /*or $(window).height() */ && rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */;
    },
    getElementInViewOf: function (frame, elements) {
        if (!elements || !frame) return null;
        for (let element of elements) {
            if (this.isElementInViewOf(frame, element)) return element;
        }
        return false;
    },
    isElementInViewOf: function (frame, element) {
        let rect = element.getBoundingClientRect();
        let frameRect = frame.getBoundingClientRect();
        return rect.top >= frameRect.top && rect.left >= frameRect.left && rect.bottom <= frameRect.bottom && rect.right <= frameRect.right;
    },
    addClassUntilMultipleSiblings: function (element, className, followLink) {
        while (element) {
            if (element.nodeType === Node.ELEMENT_NODE) {
                element.classList.add(className);
                if (element.firstElementChild && this.getElementSiblings(element.firstElementChild).length > 0) {
                    element.firstElementChild.classList.add(className);
                    const firstLink = element.firstElementChild.getElementsByTagName('a')[0];
                    if (followLink && firstLink) firstLink.click();
                    return false;
                }
            }
            element = element.firstElementChild || element.firstChild;
        }
    },
    removeClassInCollection: function (collection, className, includeDescendants) {
        for (let item in collection) {
            if (collection[item].classList) {
                collection[item].classList.remove(className);
            }
            if (includeDescendants) {
                this.removeClassInCollection(collection[item].children, className, includeDescendants);
            }
        }
    },
    getCurrentScope: function (source, selector) {
        while (source != null) {
            if (source.querySelector(selector)) return source.querySelector(selector);
            source = source.parentNode;
        }
        return false;
    },
    getDocumentElement: function (selector) {
        return document.querySelector(selector);
    },
    getDocumentElements: function (selector) {
        return document.querySelectorAll(selector);
    },
    getHopsToTheWindow: function (element) {
        let hops = 0;
        if (!element) return;
        while (window.document !== element) {
            hops++;
            element = element.parentNode;
        }
        return hops;
    },
    getElementSiblings: function (element, filter, filterArg) {
        let siblings = [];
        const initial = element;
        element = element.parentNode ? element.parentNode.firstChild : false;
        if (!element) return siblings;
        while (element) {
            if (element !== initial && element.nodeType === Node.ELEMENT_NODE) {
                if (!filter || filter(element, filterArg)) {
                    siblings.push(element);
                }
            }
            element = element.nextElementSibling || element.nextSibling;
        }
        return siblings;
    },
    getPreviousSiblings: function (element, filter, filterArg) {
        let siblings = [];
        element = element.previousSibling ? element.previousSibling : false;
        if (!element) return siblings;
        while (element) {
            if (element.nodeType === Node.ELEMENT_NODE) {
                if (!filter || filter(element, filterArg)) {
                    siblings.push(element);
                }
            }
            element = element.previousElementSibling || element.previousSibling;
        }
        return siblings;
    },
    getNextSiblings: function (element, filter, filterArg) {
        let siblings = [];
        element = element.nextSibling ? element.nextSibling : false;
        if (!element) return siblings;
        while (element) {
            if (element.nodeType === Node.ELEMENT_NODE) {
                if (!filter || filter(element, filterArg)) {
                    siblings.push(element);
                }
            }
            element = element.nextElementSibling || element.nextSibling;
        }
        return siblings;
    },
    getAllElementSiblings: function (element, filter, filterArg) {
        let siblings = [];
        element = element.parentNode ? element.parentNode.firstChild : false;
        if (!element) return siblings;
        while (element) {
            if (element.nodeType === Node.ELEMENT_NODE) {
                if (!filter || filter(element, filterArg)) {
                    siblings.push(element);
                }
            }
            element = element.nextElementSibling || element.nextSibling;
        }
        return siblings;
    },
    // not used
    addClassInCollection: function (collection, className) {
        for (let item in collection) {
            collection[item].classList && collection[item].classList.add(className);
        }
    },
    // not used
    containsSelector: function (element, selector) {
        if (element.querySelector(selector)) return true;
        return false;
    },
    containsClass: function (element, className) {
        if (element.className && element.classList.contains(className)) return true;
        return false;
    },
    isSameOrigin: (url) => new URL(url).origin === window.location.origin,
    // custom queryString parser, returns object or array
    parseQueryString: function (queryString, asArray) {
        let result = asArray ? [] : {};
        if (!queryString) return result;
        queryString = decodeURIComponent(queryString).replace(/^\?/, '');
        let params = queryString.split('&');
        if (params.length > 0) {
            for (let i = 0; i < params.length; i++) {
                let args = params[i].split('=');
                if (args[1] !== undefined) {
                    if (args[1] === 'true') {
                        result[args[0]] = true;
                    } else if (args[1] === 'false') {
                        result[args[0]] = false;
                    } else if (args[1] === 'null') {
                        result[args[0]] = null;
                    } else if (this.isNumeric(args[1])) {
                        result[args[0]] = parseFloat(args[1]);
                    } else if (args[1].charAt(0) === '{' || args[1].charAt(0) === '[') {
                        try {
                            result[args[0]] = JSON.parse(args[1]);
                        } catch (e) {
                            result[args[0]] = 'malformed';
                        }
                    } else if (args[1].includes(',')) {
                        result[args[0]] = args[1].split(',');
                        result[args[0]].forEach((item, i) => {
                            if (item === 'true') result[args[0]][i] = true;
                            if (item === 'false') result[args[0]][i] = false;
                            if (item === 'null') result[args[0]][i] = null;
                            if (this.isNumeric(item)) result[args[0]][i] = parseFloat(item);
                            if (item.charAt(0) === '{' || item.charAt(0) === '[') {
                                try {
                                    result[args[0]][i] = JSON.parse(item);
                                } catch (e) {
                                    result[args[0]][i] = 'malformed';
                                }
                            }
                        });
                    } else {
                        result[args[0]] = args[1];
                    }
                }
            }
        }
        return result;
    },
    // custom query stringify
    queryStringify: function (object) {
        if (typeof object !== 'object' || Array.isArray(object)) return '';
        return (
            '?' +
            Object.keys(object)
                .map((key) => (this.isSimpleArray(object[key]) ? key + '=' + object[key].join(',') : typeof object[key] === 'object' ? key + '=' + JSON.stringify(object[key]) : key + '=' + object[key]))
                .join('&')
        );
    },
    // merge two queryStrings or object with queryString
    // test example:
    // const initial = '?empt=&undefined&true=true&false=false&null=null&zero=0&one=1&arr=1,2,3&obj={"foo":2,"deep":{"empty":"","null":null}}';
    // const upserts = { empty: '', tru: true, fals: false, nul: null, zer: 0, once: 1, deepArr: [0, null, , 'a', { a: '' }] };
    mergeQueryStrings: function (initial, upserts) {
        if (typeof initial !== 'string' || Array.isArray(upserts)) return '';
        if (typeof upserts === 'string') {
            return this.queryStringify(Object.assign(this.parseQueryString(initial), this.parseQueryString(upserts)));
        } else if (typeof upserts === 'object') {
            return this.queryStringify(Object.assign(this.parseQueryString(initial), upserts));
        }
    },
    adjustUrlPathSegment: function (url, pathSegment, replacement, prependIfNoMatch = true) {
        if (!(pathSegment instanceof RegExp)) throw new TypeError('Path Segment not a regex');
        const uri = new URL(url);
        const urlPath = uri.pathname.substring(1);
        // pathSegment must contain the trailing slash
        if (pathSegment.test(urlPath)) {
            uri.pathname = urlPath.replace(pathSegment, replacement + '/');
        } else if (!urlPath || prependIfNoMatch) {
            uri.pathname = replacement + '/' + urlPath;
        } else {
            const pathParts = urlPath.split('/');
            pathParts[pathParts.length - 1] = replacement + '/' + pathParts[pathParts.length - 1];
            uri.pathname = pathParts.join('/');
        }
        return uri.href;
    },
    //<!-- Get url fragment -->
    getHash: function (url) {
        if (url) {
            const hashPos = url.lastIndexOf('#');
            return hashPos > -1 ? url.substring(hashPos) : null;
        }
        return false;
    },
    formDataToObject: function (formData) {
        return Object.fromEntries(formData);
    },
    // loadScript('content/hbs/precompiled/section1.js').then(() => console.log('merge'));
    loadScript: async function (url) {
        const scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.onload = resolve;
            script.onerror = reject;
            script.async = true;
            script.src = url;
            document.body.appendChild(script);
        });
        return await scriptPromise;
    },
    stringToDecimalUnicodePoints: function (string) {
        if (typeof string !== 'string') return [];
        return string.split('').map((char) => char.charCodeAt(0));
    },
    decimalUnicodePointsToString: function (unicodePoints) {
        if (!(unicodePoints instanceof Array)) return '';
        return unicodePoints.map((i) => String.fromCharCode(i)).join('');
    },
    // Capitalize
    capitalizeFirstLetter: (string) => string.charAt(0).toUpperCase() + string.slice(1),
    // camelCase strings
    camelCase: function (...strings) {
        let result = strings[0].toLowerCase();
        for (let i = 1; i < strings.length; i++) {
            result += this.capitalizeFirstLetter(strings[i].toLowerCase());
        }
        return result;
    },
    getStylesheetSelectorProperty: function (selector, property) {
        const forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
        forEach(document.styleSheets, function (sheet, index) {
            forEach(sheet.cssRules || sheet.rules, function (rule) {
                if (rule instanceof CSSStyleRule && rule.selectorText == selector && rule.style[property]) {
                    return rule.style[property];
                }
            });
        });
    },
    sleep: function (milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if (new Date().getTime() - start > milliseconds) {
                break;
            }
        }
    },
    delay: async function (milliseconds) {
        await new Promise((resolve) => setTimeout(resolve, milliseconds));
    },
    microtime: function (getAsFloat) {
        var s, now, multiplier;
        if (typeof performance !== 'undefined' && performance.now) {
            now = (performance.now() + performance.timing.navigationStart) / 1000;
            multiplier = 1e6; // 1,000,000 for microseconds
        } else {
            now = (Date.now ? Date.now() : new Date().getTime()) / 1000;
            multiplier = 1e3; // 1,000
        }
        // Getting microtime as a float is easy
        if (getAsFloat) return now;
        // Dirty trick to only get the integer part
        s = now | 0;
        return Math.round((now - s) * multiplier) / multiplier + ' ' + s;
    },
    generateUUID: function () {
        // Public Domain/MIT
        var d = new Date().getTime(); //Timestamp
        var d2 = (performance && performance.now && performance.now() * 1000) || 0; //Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16; //random number between 0 and 16
            if (d > 0) {
                //Use timestamp until depleted
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            } else {
                //Use microseconds since page-load if supported
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
    },
};
// //<!-- Copy to clipboard neverificat -->
// function copyToClipboard(sender, event) {
//     event.preventDefault();
//     event.stopPropagation();
//     const id = sender.id;
//     const text = sender.href;
//     const input = document.createElement('input');
//     document.body.appendChild(input);
//     input.value(text).select();
//     document.execCommand("copy");
//     input.remove();
//     sender.setAttribute('data-original-title', 'Copied to clipboard!').tooltip('show');
// }

// //<!-- Toggle specific form inputs at once -->
// function toggleAllInputs(formname, checktoggle) {
//     var checkboxes = new Array();
//     checkboxes = document[formname].getElementsByTagName('input');
//     for (let i = 0; i < checkboxes.length; i++) {
//         if (checkboxes[i].type === 'checkbox') {
//             checkboxes[i].checked = checktoggle;
//         }
//         if (checkboxes[i].type === 'radio' && checktoggle === false) {
//             checkboxes[i].checked = checktoggle;
//         }
//     }
// }
