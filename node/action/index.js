'use strict';
// npm run action => "scripts": { "action": "node zerodep/node/action" ]
const fs = require('..fs');
const exec = require('../exec');
const workdir = process.argv[1];
// cut argv keys that led here
process.argv.shift();
process.argv.shift();
// the remaining args are passed to the required script
const execDeepest = () => {
    // this is the authoritative level where first arg is the verb and the second is the subject
    if (fs.exists(workdir, ...process.argv.slice(0, 2))) return exec('node', fs.pathResolve(workdir, ...process.argv.slice(0, 2)), ...process.argv.slice(2));
    // this is the global level for the verb and would address all the subjects that doesn't have own authoritative level
    if (fs.exists(workdir, `${process.argv[0]}/index.js`)) return exec('node', fs.pathResolve(workdir, process.argv[0]), ...process.argv.slice(1));
    // print stdout error
    console.error("FATAL ERROR: Invalid action: '/%s/%s' or '/%s' does not exist in '%s'!", process.argv[0], process.argv[1], process.argv[0], workdir);
    process.exit(1);
};

module.exports = execDeepest();
