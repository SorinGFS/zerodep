'use strict';
// remember: typeof null === 'object';
module.exports = {
    // get the hash of a given password
    getPasswordHash: async (password) => {
        return new Promise((resolve, reject) => {
            // generate random 16 bytes long salt
            const salt = require('crypto').randomBytes(16).toString('hex');
            require('crypto').scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                resolve(salt + ':' + derivedKey.toString('hex'));
            });
        });
    },
    // test if the given password is matching the stored hash
    isMatchPasswordHash: (password, hash) => {
        return new Promise((resolve, reject) => {
            const [salt, key] = hash.split(':');
            require('crypto').scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                resolve(require('crypto').timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
            });
        });
    },
    // base64 encode
    btoa: (decoded) => {
        if (Array.isArray(decoded)) return Buffer.from(decoded.join(','), 'binary').toString('base64').replace(/=.*$/, '');
        return Buffer.from(decoded, 'binary').toString('base64').replace(/=.*$/, '');
    },
    // base64 decode
    atob: (b64Encoded) => Buffer.from(b64Encoded, 'base64').toString('utf8'),
    // filter array unique elements
    uniqueArray: (array) => Array.isArray(array) && [...new Set(array)],
    // filter array duplicates
    arrayDuplicates: (array) => Array.isArray(array) && array.filter((item, index) => index !== array.indexOf(item)),
    // test if string is numeric
    isNumeric: (string) => !isNaN(parseFloat(string)) && isFinite(string),
    // test if type is object but not array
    isObjectNotArray: (object) => object && typeof object === 'object' && !Array.isArray(object),
    // test if array and has no object items
    isSimpleArray: (array) => Array.isArray(array) && !array.filter((item) => typeof item === 'object').length,
    // test if target array includes all the items from the compared array
    includesArrayItems: (target, compared) => Array.isArray(target) && Array.isArray(compared) && compared.every((item) => target.includes(item)),
    // test if a given context fits in a larger context
    isContextMatch: (ctx, match, minMatchKeys = 1) => {
        return typeof ctx === 'object' && typeof match === 'object' && Object.keys(match).length >= minMatchKeys && Object.keys(match).reduce((acc, key) => acc && ctx[key] == match[key], true);
    },
    // test if a given context fits in a larger context including types
    isExactContextMatch: (ctx, match, minMatchKeys = 1) => {
        return typeof ctx === 'object' && typeof match === 'object' && Object.keys(match).length >= minMatchKeys && Object.keys(match).reduce((acc, key) => acc && ctx[key] === match[key], true);
    },
    // test if a given context fits in a larger context - any of array items if value - all of array items if array
    isInContextMatch: function (ctx, match, minMatchKeys = 1) {
        return typeof ctx === 'object' && typeof match === 'object' && Object.keys(match).length >= minMatchKeys && Object.keys(match).reduce((acc, key) => acc && (ctx[key] == match[key] || (Array.isArray(match[key]) && match[key].includes(ctx[key])) || this.includesArrayItems(ctx[key], match[key])), true);
    },
    // test if a given context fits in a larger context including types - any of array items if value - all of array items if array
    isInExactContextMatch: function (ctx, match, minMatchKeys = 1) {
        return typeof ctx === 'object' && typeof match === 'object' && Object.keys(match).length >= minMatchKeys && Object.keys(match).reduce((acc, key) => acc && (ctx[key] === match[key] || (Array.isArray(match[key]) && match[key].includes(ctx[key])) || this.includesArrayItems(ctx[key], match[key])), true);
    },
    // test if a given contexts array has a fit in a larger context - 1 level deep
    hasContextMatch: (ctx, matches, minMatchKeys = 1) => {
        return typeof ctx === 'object' && Array.isArray(matches) && Object.keys(matches).reduce((acc, index) => acc || (typeof matches[index] === 'object' && Object.keys(matches[index]).length >= minMatchKeys && Object.keys(matches[index]).reduce((acc, key) => acc && ctx[key] == matches[index][key], true)), false);
    },
    // test if a given contexts array has a fit in a larger context including types - 1 level deep
    hasExactContextMatch: (ctx, matches, minMatchKeys = 1) => {
        return typeof ctx === 'object' && Array.isArray(matches) && Object.keys(matches).reduce((acc, index) => acc || (typeof matches[index] === 'object' && Object.keys(matches[index]).length >= minMatchKeys && Object.keys(matches[index]).reduce((acc, key) => acc && ctx[key] === matches[index][key], true)), false);
    },
    // test if a given contexts array has a fit in a larger context - 2 levels deep
    hasContextsMatches: function (ctx, matches, minMatchKeys = 1) {
        return typeof ctx === 'object' && Array.isArray(matches) && matches.reduce((acc, item) => (acc ? acc : typeof item === 'object' && Object.keys(item).reduce((acc, key) => acc && typeof item[key] === 'object' && this.isContextMatch(ctx[key], item[key], minMatchKeys), true)), false);
    },
    // test if a given contexts array has a fit in a larger context including types - 2 levels deep
    hasExactContextsMatches: function (ctx, matches, minMatchKeys = 1) {
        return typeof ctx === 'object' && Array.isArray(matches) && matches.reduce((acc, item) => (acc ? acc : typeof item === 'object' && Object.keys(item).reduce((acc, key) => acc && typeof item[key] === 'object' && this.isExactContextMatch(ctx[key], item[key], minMatchKeys), true)), false);
    },
    // test if a given contexts array has a fit in a larger context - any of array items if value - all of array items if array
    hasInContextsMatches: function (ctx, matches, minMatchKeys = 1) {
        return typeof ctx === 'object' && Array.isArray(matches) && matches.reduce((acc, item) => (acc ? acc : typeof item === 'object' && Object.keys(item).reduce((acc, key) => acc && typeof item[key] === 'object' && this.isInContextMatch(ctx[key], item[key], minMatchKeys), true)), false);
    },
    // test if a given contexts array has a fit in a larger context including types - any of array items if value - all of array items if array
    hasInExactContextsMatches: function (ctx, matches, minMatchKeys = 1) {
        return typeof ctx === 'object' && Array.isArray(matches) && matches.reduce((acc, item) => (acc ? acc : typeof item === 'object' && Object.keys(item).reduce((acc, key) => acc && typeof item[key] === 'object' && this.isInExactContextMatch(ctx[key], item[key], minMatchKeys), true)), false);
    },
    // map a table like data to a tree view, eg. const schema = (obj) => ({ [obj.category]: { [obj.month]: obj.total } });
    treeViewArray: (target, parse) => {
        if (!Array.isArray(target)) return {};
        return Promise.resolve(target.reduce((acc, value) => this.mergeDeep(acc, parse(value)), {}));
    },
    // test JSON problematic chars from string
    hasJsonProblematicChars: (string) => /[\u0000-\u0007\u000B\u000E-\u001F\u007F-\u009F\u2028\u2029]/g.test(string),
    // remove JSON problematic chars from string
    removeJsonProblematicChars: (string) => string.replace(/[\u0000-\u0007\u000B\u000E-\u001F\u007F-\u009F\u2028\u2029]/g, ''),
    // escape JSON problematic chars in string
    escapeJsonProblematicChars: (string) => string.replace(/[\u0000-\u0007\u000B\u000E-\u001F\u007F-\u009F\u2028\u2029]/g, (match) => '\\u' + match.charCodeAt(0).toString(16).padStart(4, '0')),
    // converts object keys to jsonPointer
    jsonPointer: (...keys) => keys.map((key) => String(key).replace(/\\(.)/g, '$1').replaceAll('~', '~0').replaceAll('/', '~1')).join('/'),
    // converts jsonPointer to object keys
    jsonPointerKeys: (jsonPointer) => {
        return String(jsonPointer)
            .split('/')
            .map((key) =>
                key
                    .replace(/[\u0022\u005C\u0000-\u001F]/g, '\\$&')
                    .replaceAll('~1', '/')
                    .replaceAll('~0', '~')
            );
    },
    // get: function (object, ...keys) {
    //     if (typeof object === 'undefined') return false;
    //     if (keys.length === 0) return object;
    //     if (keys.length === 1) return object[keys[0]];
    //     return this.get(object[keys.shift()], ...keys);
    // },
    // https://gist.github.com/jeneg/9767afdcca45601ea44930ea03e0febf
    // split the object reference by corresponding delimiter and pass the keys array using spread operator
    get: (object, ...keys) => {
        return keys.reduce((node, key) => {
            try {
                return node[key];
            } catch (e) {
                return undefined;
            }
        }, object);
    },
    // set deep object key (the deepest value will not be passed)
    set: (value, object, ...keys) => {
        if (!keys.length) return (object = value);
        const key = keys.pop();
        const target = keys.reduce((node, key) => {
            try {
                if (node[key] !== undefined) return node[key];
                if (node[key] === undefined) return (node[key] = {}) && node[key];
            } catch (e) {
                return undefined;
            }
        }, object);
        if (target) return ((target[key] = value) && true) || true;
    },
    // set deep object key (the deepest value will be passed)
    setDeep: (value, object, ...keys) => {
        if (!keys.length) return (object = value);
        const key = keys.pop();
        const target = keys.reduce((node, key) => {
            try {
                return node[key];
            } catch (e) {
                return undefined;
            }
        }, object);
        if (target) return ((target[key] = value) && true) || true;
    },
    delete: (object, ...keys) => {
        if (!keys.length) return;
        const key = keys.pop();
        const target = keys.reduce((node, key) => {
            try {
                return node[key];
            } catch (e) {
                return undefined;
            }
        }, object);
        if (target && typeof target[key] !== undefined) return (delete target[key] && true) || true;
    },
    // returns a static object by embeding the values of the referenced keys
    clone: (object, ...keys) => {
        // this is dead slow for larger objects
        const cloneDeep = (object) => {
            if (typeof object !== 'object' || object === null) return object;
            else if (Array.isArray(object)) return object.map(cloneDeep);
            return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, cloneDeep(value)]));
        };
        if (!keys.length) return cloneDeep(object);
        const key = keys.pop();
        const target = keys.reduce((node, key) => {
            try {
                return node[key];
            } catch (e) {
                return undefined;
            }
        }, object);
        if (target) return cloneDeep(target[key]);
    },
    // same as clone but object keys are sorted
    structuredClone: (object, ...keys) => {
        // this is dead slow for larger objects
        const cloneDeep = (object) => {
            if (typeof object !== 'object' || object === null) return object;
            else if (Array.isArray(object)) return object.map(cloneDeep);
            return Object.fromEntries(
                Object.entries(object)
                    .sort()
                    .map(([key, value]) => [key, cloneDeep(value)])
            );
        };
        if (!keys.length) return cloneDeep(object);
        const key = keys.pop();
        const target = keys.reduce((node, key) => {
            try {
                return node[key];
            } catch (e) {
                return undefined;
            }
        }, object);
        if (target) return cloneDeep(target[key]);
    },
    // returns an array of deep keys not including shallow object keys
    deepKeys: function (object) {
        let array = [];
        Object.keys(object).forEach((key) => {
            this.parseDeep((...keys) => {
                array.push(...keys);
            }, object[key]);
        });
        array = this.uniqueArray(String(array).split(',')).sort();
        array.forEach((value, index) => {
            if (this.isNumeric(value)) delete array[index];
        });
        return array.filter((n) => n);
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
    // parser shoud return object or array of objects, null, undefined or nothing
    replaceDeep: function (parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).find((key) => {
                    let assignments = parser(node[key], key);
                    if (assignments instanceof Object) {
                        delete node[key];
                        if (Array.isArray(node)) {
                            Object.entries(assignments).forEach((entry) => {
                                if (node[entry[0]] instanceof Object && entry[1] instanceof Object) {
                                    Object.assign(node[entry[0]], entry[1]);
                                } else {
                                    node[entry[0]] = entry[1];
                                }
                            });
                        } else {
                            if (!Array.isArray(assignments)) assignments = [assignments];
                            Object.assign(node, ...assignments);
                        }
                        parse(...keys);
                        return true;
                    }
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // parser shoud return object or array of objects, null, undefined or nothing
    replaceDeepKey: function (keyToParse, parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).find((key) => {
                    if (key === keyToParse || (keyToParse instanceof RegExp && keyToParse.test(key))) {
                        let assignments = parser(node[key], key);
                        if (assignments instanceof Object) {
                            delete node[key];
                            if (Array.isArray(node)) {
                                Object.entries(assignments).forEach((entry) => {
                                    if (node[entry[0]] instanceof Object && entry[1] instanceof Object) {
                                        Object.assign(node[entry[0]], entry[1]);
                                    } else {
                                        node[entry[0]] = entry[1];
                                    }
                                });
                            } else {
                                if (!Array.isArray(assignments)) assignments = [assignments];
                                Object.assign(node, ...assignments);
                            }
                            parse(...keys);
                            return true;
                        }
                    }
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // parser shoud return object or array of objects, null, undefined or nothing
    replaceDeepKeyParent: function (keyToParse, parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).find((key) => {
                    if (keys.length && (key === keyToParse || (keyToParse instanceof RegExp && keyToParse.test(key)))) {
                        const granParent = keys.slice(0, -1).reduce((node, key) => node[key], object);
                        const parentKey = String(keys.slice(-1));
                        let assignments = parser(granParent[parentKey], parentKey, key);
                        if (assignments instanceof Object) {
                            delete granParent[parentKey];
                            if (Array.isArray(granParent)) {
                                Object.entries(assignments).forEach((entry) => {
                                    if (granParent[entry[0]] instanceof Object && entry[1] instanceof Object) {
                                        Object.assign(granParent[entry[0]], entry[1]);
                                    } else {
                                        granParent[entry[0]] = entry[1];
                                    }
                                });
                            } else {
                                if (!Array.isArray(assignments)) assignments = [assignments];
                                Object.assign(granParent, ...assignments);
                            }
                            parse(...keys.slice(0, -1));
                            return true;
                        }
                    }
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // parser shoud return object or array of objects, null, undefined or nothing
    replaceDeepPath: function (pathToParse, parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).find((key) => {
                    if ((typeof pathToParse === 'string' && [...keys, key].join('/').endsWith(pathToParse)) || (pathToParse instanceof RegExp && pathToParse.test([...keys, key].join('/')))) {
                        let assignments = parser(node[key], key);
                        if (assignments instanceof Object) {
                            delete node[key];
                            if (Array.isArray(node)) {
                                Object.entries(assignments).forEach((entry) => {
                                    if (node[entry[0]] instanceof Object && entry[1] instanceof Object) {
                                        Object.assign(node[entry[0]], entry[1]);
                                    } else {
                                        node[entry[0]] = entry[1];
                                    }
                                });
                            } else {
                                if (!Array.isArray(assignments)) assignments = [assignments];
                                Object.assign(node, ...assignments);
                            }
                            parse(...keys);
                            return true;
                        }
                    }
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // parser shoud return object or array of objects, null, undefined or nothing
    assignDeep: function (parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).forEach((key) => {
                    let assignments = parser(node[key], key);
                    if (assignments instanceof Object) {
                        if (Array.isArray(node)) {
                            Object.entries(assignments).forEach((entry) => {
                                if (node[entry[0]] instanceof Object && entry[1] instanceof Object) {
                                    Object.assign(node[entry[0]], entry[1]);
                                } else {
                                    node[entry[0]] = entry[1];
                                }
                            });
                        } else {
                            if (!Array.isArray(assignments)) assignments = [assignments];
                            Object.assign(node, ...assignments);
                        }
                    }
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // parser shoud return object or array of objects, null, undefined or nothing
    assignDeepKey: function (keyToParse, parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).forEach((key) => {
                    if (key === keyToParse || (keyToParse instanceof RegExp && keyToParse.test(key))) {
                        let assignments = parser(node[key], key);
                        if (assignments instanceof Object) {
                            if (Array.isArray(node)) {
                                Object.entries(assignments).forEach((entry) => {
                                    if (node[entry[0]] instanceof Object && entry[1] instanceof Object) {
                                        Object.assign(node[entry[0]], entry[1]);
                                    } else {
                                        node[entry[0]] = entry[1];
                                    }
                                });
                            } else {
                                if (!Array.isArray(assignments)) assignments = [assignments];
                                Object.assign(node, ...assignments);
                            }
                        }
                    }
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // parser shoud return object or array of objects, null, undefined or nothing
    assignDeepKeyParent: function (keyToParse, parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).forEach((key) => {
                    if (keys.length && (key === keyToParse || (keyToParse instanceof RegExp && keyToParse.test(key)))) {
                        const granParent = keys.slice(0, -1).reduce((node, key) => node[key], object);
                        const parentKey = String(keys.slice(-1));
                        let assignments = parser(granParent[parentKey], parentKey, key);
                        if (assignments instanceof Object) {
                            if (Array.isArray(granParent)) {
                                Object.entries(assignments).forEach((entry) => {
                                    if (granParent[entry[0]] instanceof Object && entry[1] instanceof Object) {
                                        Object.assign(granParent[entry[0]], entry[1]);
                                    } else {
                                        granParent[entry[0]] = entry[1];
                                    }
                                });
                            } else {
                                if (!Array.isArray(assignments)) assignments = [assignments];
                                Object.assign(granParent, ...assignments);
                            }
                        }
                    }
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // parser shoud return object or array of objects, null, undefined or nothing
    assignDeepPath: function (pathToParse, parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).forEach((key) => {
                    if ((typeof pathToParse === 'string' && [...keys, key].join('/').endsWith(pathToParse)) || (pathToParse instanceof RegExp && pathToParse.test([...keys, key].join('/')))) {
                        let assignments = parser(node[key], key);
                        if (assignments instanceof Object) {
                            if (Array.isArray(node)) {
                                Object.entries(assignments).forEach((entry) => {
                                    if (node[entry[0]] instanceof Object && entry[1] instanceof Object) {
                                        Object.assign(node[entry[0]], entry[1]);
                                    } else {
                                        node[entry[0]] = entry[1];
                                    }
                                });
                            } else {
                                if (!Array.isArray(assignments)) assignments = [assignments];
                                Object.assign(node, ...assignments);
                            }
                        }
                    }
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // deep parse a given object by a given parser
    parseDeep: function (parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).forEach((key) => {
                    parser(...keys, key) && parse(...keys);
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // deep parse a given object key by a given parser
    parseDeepKey: function (keyToParse, parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).forEach((key) => {
                    if (key === keyToParse || (keyToParse instanceof RegExp && keyToParse.test(key))) parser(...keys, key) && parse(...keys);
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // deep parse a given object key's parent by a given parser
    parseDeepKeyParent: function (keyToParse, parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).forEach((key) => {
                    if (keys.length && (key === keyToParse || (keyToParse instanceof RegExp && keyToParse.test(key)))) parser(...keys) && parse(...keys.slice(0, -1));
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // parse a deep path (string of consecutive keys joined by /)
    parseDeepPath: function (pathToParse, parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).forEach((key) => {
                    if ((typeof pathToParse === 'string' && [...keys, key].join('/').endsWith(pathToParse)) || (pathToParse instanceof RegExp && pathToParse.test([...keys, key].join('/')))) parser(...keys, key) && parse(...keys);
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // test a - b objects equality. Comparing objects this way is slow and wrong, use with care.
    areEqualObjects: (a, b) => {
        let s = (o) =>
            Object.entries(o)
                .sort()
                .map((i) => {
                    if (i[1] instanceof Object) i[1] = s(i[1]);
                    return i;
                });
        return JSON.stringify(s(a)) === JSON.stringify(s(b));
    },
    // faster than areEqualObjects
    areArraysIdentical: (arr1, arr2) => {
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            if (arr1.length !== arr2.length) return false;
            for (let i = 0; i < arr1.length; i++) {
                if (arr1[i] !== arr2[i]) return false;
            }
            return true;
        }
        return false;
    },
    // escape regExp special characters in order to find them literally
    escapeRegex: (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), // $& means the whole matched string
    // glob to regex: nested enclosure not (yet) supported. E.g, ?(foo?(bar)). Negative lookahead not working at the end of glob.
    globToRegex: function (globPattern) {
        let regexPattern = globPattern;
        // extended glob
        if (/\?\(|\+\(|\*\(|!\(|@\(/.test(globPattern)) {
            regexPattern = regexPattern
                .replace(/\?\(([^\(\))]+)\)/g, '{$1}?') // Convert ?(pattern) to {pattern}?
                .replace(/\+\(([^\(\))]+)\)/g, '{$1}+') // Convert +(pattern) to {pattern}+
                .replace(/\*\(([^\(\))]+)\)/g, '{$1}*') // Convert *(pattern) to {pattern}*
                .replace(/!\(([^\(\))]+)\)/g, '{?!$1}') // Convert !(pattern) to {?!pattern}
                .replace(/@\(([^\(\))]+)\)/g, '{$1}{1}') // Convert @(pattern) to {pattern}{1}
                .replace(/\|/g, ','); // Replace pipes with commas
        }
        regexPattern =
            regexPattern
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape characters with special meaning in regex
                .replace(/[\\\*]{4,}/g, '.*') // Unescape colapsed multiple wildcard as undefined number of chars
                .replace(/(\\\})\\\*/g, '$1*') // Unescape wildcard when follows a closing curly bracket
                .replace(/\\\*/g, '[^/]*') // Unescape wildcard as undefined number of chars excluding /
                .replace(/(\\\})\\\+/g, '$1+') // Unescape + when follows a closing curly bracket
                .replace(/(\\\})\\\?/g, '$1?') // Unescape ? when follows a closing curly bracket
                .replace(/(\\\{)\\\?/g, '$1?') // Unescape ? when follows a opening curly bracket
                .replace(/\\\?/g, '.') // Unescape ? as single character .
                .replace(/\\\[/g, '[') // Unescape group opening bracket [
                .replace(/\\\]/g, ']') // Unescape group closing bracket ]
                .replace(/\\\{1/g, '{1') // Unescape {1 as {1
                .replace(/1\\\}/g, '1}') // Unescape 1} as 1}
                .replace(/\\\{/g, '(') // Unescape { as opening bracket (
                .replace(/\\\}/g, ')') // Unescape { as closing bracket )
                .replace(/,/g, '|') + '$'; // Replace comma with pipe and add the end of regex
        return regexPattern;
    },
    // regexToGlob is assuming that regexPattern was created using globToRegex
    regexToGlob: function (regexPattern) {
        let globPattern = regexPattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape characters with special meaning in regex
            .replace(/\\\$$/g, '') // Replace the end of regex with nothing
            .replace(/\\\|/g, ',') // Replace pipe with comma
            .replace(/(\\\))\\\?/g, '$1?') // Unescape ? when follows a closing bracket
            .replace(/(\\\))\\\+/g, '$1+') // Unescape + when follows a closing bracket
            .replace(/\\\[\\\^\/\\\]\\\*/g, '*') // Unescape wildcard * when not forward slash before
            .replace(/(\\\))\\\*/g, '$1*') // Unescape wildcard * when follows a closing bracket
            .replace(/\\\.\\\*/g, '**') // Unescape undefined number of chars .* as double wildcard **
            .replace(/\\\\\\\./g, '.') // Unescape . as . when escaped in regex
            .replace(/\\\./g, '?') // Unescape single character . as ?
            .replace(/\\\]/g, ']') // Unescape group closing bracket ]
            .replace(/\\\[/g, '[') // Unescape group opening bracket [
            .replace(/\\\)/g, '}') // Unescape ) as closing curly bracket }
            .replace(/\\\(/g, '{'); // Unescape ( as opening curly bracket {
        // extended glob
        if (/\)\*|\)\+|\)\?|\(\?\!|\)\{1\}/.test(regexPattern)) {
            globPattern = globPattern
                .replace(/\{([^\{\}]+)\}\*/g, '*($1)') // Convert {pattern}* to *(pattern)
                .replace(/\{([^\{\}]+)\}\+/g, '+($1)') // Convert {pattern}+ to +(pattern)
                .replace(/\{([^\{\}]+)\}\?/g, '?($1)') // Convert {pattern}? to ?(pattern)
                .replace(/\{\\\?\!([^\{\}]+)\}/g, '!($1)') // Convert {?!pattern} to !(pattern)
                .replace(/\{([^\{\}]+)\}\\\{1\\\}/g, '@($1)') // Convert {pattern}{1} to @(pattern)
                .replace(/,(?![^\{]*\})/g, '|'); // Replace pipes with commas
        }
        return globPattern;
    },
    // string parser
    search: (string, regex, parser) => {
        do {
            var match = regex.exec(string);
            if (match != null) parser(match);
        } while (match != null);
    },
    // same as string.matchAll(regex) except it returns array instead of iterator
    stringMatches: function (string, regex) {
        let array = [];
        this.search(string, regex, (match) => array.push(match));
        return array;
    },
    // same as string.match(regex) except it returns group matches only
    stringCaptureGroupMatches: function (string, regex) {
        let array = [];
        this.search(string, regex, (match) => array.push(match.shift() && match.find((value) => value)));
        return array;
    },
    // same as string.match(regex) except it returns group matches first
    stringCaptureGroupsOrMatches: function (string, regex) {
        let array = [];
        this.search(string, regex, (match) => array.push(match.reverse().find((value) => value)));
        return array;
    },
    // the result relative uri reference applied to base will point to targetUriReference
    relativeUriReference: (targetUriReference, base = 'schema:/') => {
        base = new URL(base);
        const uri = new URL(targetUriReference, base);
        if (uri.href === base.href) return '';
        if (uri.protocol !== base.protocol) return targetUriReference;
        if (uri.host !== base.host) return '//' + decodeURI(uri.host + uri.pathname) + uri.search + decodeURI(uri.hash);
        const baseParts = base.pathname.split('/');
        const uriParts = uri.pathname.split('/');
        for (let i = 0; i < uriParts.length; i++) {
            if (baseParts[i] !== uriParts[i] && i >= baseParts.length - 1) return decodeURI(uriParts.slice(i).join('/')) + uri.search + decodeURI(uri.hash);
            if (baseParts[i] !== uriParts[i]) return '../'.repeat(baseParts.length - i - 1) + decodeURI(uriParts.slice(i).join('/')) + uri.search + decodeURI(uri.hash);
            if (i === uriParts.length - 1 && uri.search !== base.search && uri.hash !== base.hash) return uri.search + decodeURI(uri.hash);
            if (i === uriParts.length - 1 && uri.search !== base.search) return uri.search;
            if (i === uriParts.length - 1 && uri.hash !== base.hash) return decodeURI(uri.hash);
        }
        return targetUriReference;
    },
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
    // convert string to decimal unicode points
    stringToDecimalUnicodePoints: (string) => {
        if (typeof string !== 'string') return [];
        return string.split('').map((char) => char.charCodeAt(0));
    },
    // convert decimal unicode points to string
    decimalUnicodePointsToString: (unicodePoints) => {
        if (!(unicodePoints instanceof Array)) return '';
        return unicodePoints.map((i) => String.fromCharCode(i)).join('');
    },
    // reverse string
    reverseString: (string) => string.split('').reverse().join(''),
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
    // prefix of two or multiple strings
    prefixOf: (...strings) => {
        // check args
        if (!strings[0] || strings.length === 1) return strings[0] || '';
        let i = 0;
        // increment i while all strings have the same char at position i
        while (strings[0][i] && strings.every((string) => string[i] === strings[0][i])) i++;
        return strings[0].substring(0, i);
    },
    // simple sleep in milliseconds (sync)
    sleep: (milliseconds) => {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if (new Date().getTime() - start > milliseconds) {
                break;
            }
        }
    },
    // time in milliseconds (the same from PHP)
    microtime: (getAsFloat) => {
        var s, now, multiplier;
        if (typeof performance !== 'undefined' && performance.now) {
            now = performance.now() / 1000;
            multiplier = 1e6; // 1,000,000 for microseconds
        } else {
            now = Date.now ? Date.now() / 1000 : Math.floor(new Date().getTime() / 1000.0);
            multiplier = 1e3; // 1,000
        }
        // Getting microtime as a float is easy
        if (getAsFloat) {
            return now;
        }
        // Dirty trick to only get the integer part
        s = now | 0;
        return Math.round((now - s) * multiplier) / multiplier + ' ' + s;
    },
    // generate UUID v4
    generateUUID: () => {
        // Public Domain/MIT
        var d = new Date().getTime(); //Timestamp
        var d2 = typeof performance !== 'undefined' && typeof performance.now !== 'undefined' ? performance.now() * 1000 : 0; //Time in microseconds since page-load or 0 if unsupported
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
    // crc32
    crc32: (r) => {
        let a;
        let o = [];
        let n = -1;
        for (let c = 0; c < 256; c++) {
            a = c;
            for (let f = 0; f < 8; f++) a = 1 & a ? 3988292384 ^ (a >>> 1) : a >>> 1;
            o[c] = a;
        }
        for (let t = 0; t < r.length; t++) n = (n >>> 8) ^ o[255 & (n ^ r.charCodeAt(t))];
        return (-1 ^ n) >>> 0;
    },
    // crc32c
    crc32c: (crc, bytes) => {
        const POLY = 0x82f63b78;
        crc ^= 0xffffffff;
        for (let n = 0; n < bytes.length; n++) {
            crc ^= bytes[n];
            crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
            crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
            crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
            crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
            crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
            crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
            crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
            crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
        }
        return crc ^ 0xffffffff;
    },
};
