'use strict';
// load json files in tree
const load = require('../load');
const fn = require('../../fn');
const fs = require('../../fs');
const prefixObjectProtoKeys = (key, value) => {
    const protoKeys = Object.getOwnPropertyNames(Object.prototype);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.keys(value).forEach((key) => {
            if (protoKeys.includes(key)) {
                value[`_${key}`] = value[key]; // Prefix unsafe key
                delete value[key]; // Remove original unsafe key
            }
        });
    }
    return value;
}
// resolved path args must be a file
const loader = (...pathResolveArgs) => {
    const file = String(pathResolveArgs.slice(-1));
    if (fs.pathExtName(file) === '.json') {
        let string = fs.readFile(fs.pathResolve(...pathResolveArgs), { encoding: 'utf-8' });
        if (fn.hasJsonProblematicChars(string)) throw new SyntaxError(`The file '${fs.pathResolve(...pathResolveArgs)}' contains JSON problematic characters.`);
        return { [file.split('.').slice(0, -1).join('.')]: JSON.parse(string, prefixObjectProtoKeys) };
    }
};
// resolved path args must be a directory or a file
module.exports = (...pathResolveArgs) => load(loader, ...pathResolveArgs);