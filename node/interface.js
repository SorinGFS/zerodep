'use strict';
// returns an interface for the structure bellow the given path
const fs = require('./fs');
const fn = require('./fn');
const config = (...pathResolveArgs) => {
    if (!fs.exists(...pathResolveArgs)) return undefined;
    const workDirArgsLength = pathResolveArgs.length;
    const object = {};
    const parse = (...pathResolveArgs) => {
        const node = pathResolveArgs.length > workDirArgsLength ? fn.get(object, ...pathResolveArgs.slice(workDirArgsLength)) : object;
        if (fs.entries(...pathResolveArgs).some((file) => ['js', 'mjs', 'json'].includes(file.split('.').pop()))) {
            fn.mergeDeep(node, require(fs.pathResolve(...pathResolveArgs)));
        }
        fs.dirs(...pathResolveArgs).forEach((dir) => {
            const entries = fs.entries(...pathResolveArgs, dir).some((file) => ['js', 'mjs', 'json'].includes(file.split('.').pop()));
            fn.mergeDeep(node, { [dir]: entries ? require(fs.pathResolve(...pathResolveArgs, dir)) : {} });
            if (fs.dirs(...pathResolveArgs, dir).length) parse(...pathResolveArgs, dir);
        });
    };
    parse(...pathResolveArgs);
    return object;
};
module.exports = config;
