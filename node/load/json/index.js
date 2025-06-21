'use strict';
// load json files in tree
const load = require('../');
const fn = require('../../fn');
const fs = require('../../fs');
const prefixObjectProtoKeys = require('./prefixObjectProtoKeys');
// resolved path args must be a file
const loader = (...pathResolveArgs) => {
    const file = String(pathResolveArgs.slice(-1));
    if (fs.pathExtName(file) === '.json') {
        const string = fs.readFile(fs.pathResolve(...pathResolveArgs), { encoding: 'utf-8' });
        if (fn.hasJsonProblematicChars(string)) throw new SyntaxError(`The file '${fs.pathResolve(...pathResolveArgs)}' contains JSON problematic characters.`);
        return { [file.split('.').slice(0, -1).join('.')]: JSON.parse(string, prefixObjectProtoKeys) };
    }
};
// resolved path args must be a directory or a file
module.exports = (...pathResolveArgs) => load(loader, ...pathResolveArgs);
