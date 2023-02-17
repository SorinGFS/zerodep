'use strict';
// load json files in tree
const load = require('../load');
const fs = require('../../fs');

const loader = (...pathResolveArgs) => {
    const file = String(pathResolveArgs.slice(-1));
    if (['json'].includes(file.split('.').pop())) {
        return { [file.split('.').slice(0, -1).join('.')]: require(fs.pathResolve(...pathResolveArgs)) };
    }
};

module.exports = (...pathResolveArgs) => load(loader, ...pathResolveArgs);
