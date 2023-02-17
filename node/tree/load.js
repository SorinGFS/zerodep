'use strict';
// load function
const fn = require('../fn');
const fs = require('../fs');

const load = (loader, ...pathResolveArgs) => {
    if (!fs.exists(...pathResolveArgs)) return undefined;
    const workDirArgsLength = pathResolveArgs.length;
    const object = {};
    const parse = (loader, ...pathResolveArgs) => {
        const node = pathResolveArgs.length > workDirArgsLength ? fn.get(object, ...pathResolveArgs.slice(workDirArgsLength)) : object;
        fs.files(...pathResolveArgs).forEach((file) => Object.assign(node, loader(...pathResolveArgs, file)));
        fs.dirs(...pathResolveArgs).forEach((dir) => (node[dir] = {}) && parse(loader, ...pathResolveArgs, dir));
    };
    parse(loader, ...pathResolveArgs);
    return object;
};

module.exports = load;