'use strict';
// loading files in the specified directory choosen by the loader
const fn = require('../fn');
const fs = require('../fs');
// load function
const load = (loader, ...pathResolveArgs) => {
    if (!fs.exists(...pathResolveArgs)) return undefined;
    const workDirArgsLength = pathResolveArgs.length;
    const object = {};
    const parse = (...pathResolveArgs) => {
        const node = pathResolveArgs.length > workDirArgsLength ? fn.get(object, ...pathResolveArgs.slice(workDirArgsLength)) : object;
        fs.files(...pathResolveArgs).forEach((file) => Object.assign(node, loader(...pathResolveArgs, file)));
        fs.dirs(...pathResolveArgs).forEach((dir) => (node[dir] = {}) && parse(...pathResolveArgs, dir));
    };
    parse(...pathResolveArgs);
    return object;
};

module.exports = load;