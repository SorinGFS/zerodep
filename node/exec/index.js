#!/usr/bin/env node
'use strict';
// define vars
const { exec } = require('child_process');
// executes the command line arguments and returns the exit code
module.exports = (...args) => {
    const child = exec(args.reduce((args, arg) => (arg.indexOf(' ') > 0 ? `${args} "${arg}"` : `${args} ${arg}`), ''));
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stdout);
    return new Promise((resolve) => child.on('close', resolve));
};
