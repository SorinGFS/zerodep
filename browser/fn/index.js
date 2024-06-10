'use strict';
// include common js functions
const fn = require('../../js/fn');
// https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file
// https://stackoverflow.com/questions/18658755/javascript-file-for-each-html-file
module.exports = {
    ...fn,
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
    // to be revised
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
    //<!-- Get url fragment --> to be checked if can be replaced with new URL(url).hash
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
    // programmatically get selector property
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
