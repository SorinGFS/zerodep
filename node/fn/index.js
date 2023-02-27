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
    // get: function (object, ...keys) {
    //     if (typeof object === 'undefined') return false;
    //     if (keys.length === 0) return object;
    //     if (keys.length === 1) return object[keys[0]];
    //     return this.get(object[keys.shift()], ...keys);
    // },
    // set: function (value, object, ...keys) {
    //     if (typeof object === 'undefined') return false;
    //     if (keys.length === 0) return object = value;
    //     if (keys.length === 1) return object[keys[0]] = value;
    //     return this.set(value, object[keys.shift()], ...keys);
    // },
    set: (value, object, ...keys) => {
        if (!keys.length) return (object = value);
        const key = keys.pop();
        const target = keys.reduce((node, key) => {
            try {
                return node[key];
            } catch (e) {
                return undefined;
            }
        }, object);
        if (target) return (target[key] = value);
    },
    clone: (object, ...keys) => {
        // this is dead slow for larger objects
        const cloneDeep = (object) => {
            if (typeof object !== 'object') return object;
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
    structuredClone: (object, ...keys) => {
        // this is dead slow for larger objects
        const cloneDeep = (object) => {
            if (typeof object !== 'object') return object;
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
                Object.keys(node).forEach((key) => {
                    let assignments = parser({ [key]: node[key] });
                    if (assignments) {
                        if (!Array.isArray(node) && !Array.isArray(assignments)) assignments = [assignments];
                        Object.assign(node, ...assignments) && delete node[key] && parse(...keys);
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
                Object.keys(node).forEach((key) => {
                    if (key === keyToParse) {
                        let assignments = parser(node[key]);
                        if (assignments) {
                            if (!Array.isArray(node) && !Array.isArray(assignments)) assignments = [assignments];
                            Object.assign(node, ...assignments) && delete node[key] && parse(...keys);
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
                Object.keys(node).forEach((key) => {
                    if (keys.length && key === keyToParse) {
                        const parent = keys.slice(0, -1).reduce((node, key) => node[key], object);
                        let assignments = parser(parent, String(keys.slice(-1, 1)));
                        if (assignments) {
                            if (!Array.isArray(parent) && !Array.isArray(assignments)) assignments = [assignments];
                            Object.assign(parent, ...assignments) && delete parent[String(keys.slice(-1, 1))] && parse(...keys.slice(0, -1));
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
                    let assignments = parser({ [key]: node[key] });
                    if (assignments) {
                        if (!Array.isArray(node) && !Array.isArray(assignments)) assignments = [assignments];
                        Object.assign(node, ...assignments);
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
                    if (key === keyToParse) {
                        let assignments = parser(node[key]);
                        if (assignments) {
                            if (!Array.isArray(node) && !Array.isArray(assignments)) assignments = [assignments];
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
    assignDeepKeyParent: function (keyToParse, parser, object, ...keys) {
        const parse = (...keys) => {
            const node = keys.reduce((node, key) => node[key], object);
            if (node && typeof node === 'object') {
                Object.keys(node).forEach((key) => {
                    if (keys.length && key === keyToParse) {
                        const parent = keys.slice(0, -1).reduce((node, key) => node[key], object);
                        let assignments = parser(parent, String(keys.slice(-1, 1)));
                        if (assignments) {
                            if (!Array.isArray(parent) && !Array.isArray(assignments)) assignments = [assignments];
                            Object.assign(parent, ...assignments);
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
                    if (key === keyToParse) parser(...keys, key) && parse(...keys);
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
                    if (keys.length && key === keyToParse) parser(...keys) && parse(...keys.slice(0, -1));
                    if (node[key] && typeof node[key] === 'object') parse(...keys, key);
                });
            }
        };
        parse(...keys);
    },
    // parses only schemas matching to data
    parseDeepSchema: function (data, schema, parse) {
        if (data && schema && typeof data === 'object') {
            Object.keys(data).reduce((matchingSchema, key) => {
                matchingSchema = this.getKeySchema(data, key, matchingSchema);
                if (matchingSchema) {
                    if (typeof data[key] === 'object') {
                        this.parseDeepSchema(data[key], matchingSchema, parse);
                    } else {
                        parse(data[key], matchingSchema);
                    }
                }
                return matchingSchema;
            }, schema);
        }
    },
    //  should return a schema or undefined
    getKeySchema: function (data, key, schema) {
        if (!key || typeof key !== 'string' || typeof schema !== 'object') return undefined;
        if (key.indexOf('.') !== -1) return this.getDotNotationKeySchema(key, schema);
        if (!Array.isArray(data)) {
            if (schema.properties && schema.properties[key]) {
                return schema.properties[key];
            } else {
                return undefined;
            }
        } else {
            if (schema.items) {
                return schema.items;
            } else {
                return undefined;
            }
        }
    },
    // should return a schema or undefined
    getDotNotationKeySchema: function (key, schema) {
        if (!key || typeof key !== 'string' || typeof schema !== 'object') return undefined;
        return key.split('.').reduce((matchingSchema, key) => {
            if (matchingSchema) {
                if (!this.isNumeric(key)) {
                    if (matchingSchema.properties && matchingSchema.properties[key]) {
                        return matchingSchema.properties[key];
                    } else {
                        return undefined;
                    }
                } else {
                    if (matchingSchema.items) {
                        return matchingSchema.items;
                    } else {
                        return undefined;
                    }
                }
            }
        }, schema);
    },
    // returns an array of dot notation keys or empty array
    getDeepDotNotationKeys: function (object) {
        if (typeof object !== 'object') return [];
        let keys = [];
        for (const key in object) {
            keys.push(key);
            if (object[key] && typeof object[key] === 'object') {
                const subkeys = this.getDeepDotNotationKeys(object[key]);
                keys = keys.concat(
                    subkeys.map((subkey) => {
                        return key + '.' + subkey;
                    })
                );
            }
        }
        return keys;
    },
    // returns an array of dot notation sckema keys or empty array
    getDeepDotNotationSchemaKeys: function (object) {
        if (typeof object !== 'object') return [];
        let keys = [];
        for (const key in object) {
            keys.push(key);
            if (object[key] && typeof object[key] === 'object') {
                const subkeys = this.getDeepDotNotationSchemaKeys(object[key]);
                keys = keys.concat(
                    subkeys.map((subkey) => {
                        if (Array.isArray(object[key])) return key + '.items';
                        return key + '.properties.' + subkey;
                    })
                );
            }
        }
        return keys;
    },
    // usage:
    // const schemaMap = fn.getDeepDotNotationSchemaMap({ data });
    // for (let key in schemaKeys) {
    //     const dataKey = fn.get({ data: data }, key);
    //     const schemaKey = fn.get({ data: schema }, schemaMap[key]);
    //     console.log(dataKey, schemaKey);
    // }
    getDeepDotNotationSchemaMap: function (object) {
        const keys = this.getDeepDotNotationKeys(object);
        const schemaKeys = this.getDeepDotNotationSchemaKeys(object);
        let result = [];
        for (let i = 0; i < keys.length; i++) {
            result[keys[i]] = schemaKeys[i];
        }
        return result;
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
    // escape regExp special characters in order to find them literally
    escapeRegExp: (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), // $& means the whole matched string
    // custom queryString parser, returns object or array
    parseQueryString: function (queryString, asArray) {
        let result = asArray ? [] : {};
        if (!queryString) return result;
        queryString = decodeURIComponent(queryString).replace(/^\?/g, '');
        let params = queryString.split('&');
        if (params.length > 0) {
            for (let i = 0; i < params.length; i++) {
                let args = params[i].split('=');
                if (args[1] === undefined) {
                    result[args[0]] = true;
                } else if (this.isNumeric(args[1])) {
                    result[args[0]] = parseFloat(args[1]);
                } else if (args[1].charAt(0) === '{') {
                    try {
                        result[args[0]] = JSON.parse(args[1]);
                    } catch (e) {}
                } else if (args[1].includes(',')) {
                    result[args[0]] = args[1].split(',');
                    result[args[0]].forEach((item, i) => {
                        if (this.isNumeric(item)) result[args[0]][i] = parseFloat(item);
                    });
                } else {
                    result[args[0]] = args[1];
                }
            }
        }
        return result;
    },
    // custom simple query stringify (will be revised)
    queryStringify: (object) => {
        return Object.keys(object)
            .map((key) => (object[key] == 'true' ? key : key + '=' + object[key]))
            .join('&');
    },
    // merge queryStrings (will be revised)
    mergeQueryStrings: function (initial, upserts) {
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
    reverseString: (str) => str.split('').reverse().join(''),
    // Capitalize
    capitalizeFirstLetter: (string) => string.charAt(0).toUpperCase() + string.slice(1),
    // Camelcase array of strings
    camelcaseStringArray: function (array) {
        if (array.constructor !== Array) return null;
        let result = array[0].toLowerCase();
        for (let i = 1; i < array.length; i++) {
            result += this.capitalizeFirstLetter(array[i].toLowerCase());
        }
        return result;
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
