'use strict';
// load json files in tree
const load = require('../load');
const fs = require('../../fs');
// resolved path args must be a file
const loader = (...pathResolveArgs) => {
    const file = String(pathResolveArgs.slice(-1));
    if (fs.pathExtName(file) === '.json') {
        return { [file.split('.').slice(0, -1).join('.')]: require(fs.pathResolve(...pathResolveArgs)) };
    }
};
// resolved path args must be a directory or a file
module.exports = (...pathResolveArgs) => load(loader, ...pathResolveArgs);
