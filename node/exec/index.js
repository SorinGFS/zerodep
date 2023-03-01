#!/usr/bin/env node
'use strict';

const { exec } = require('child_process');

module.exports = (cmd) => {
    const child = exec(cmd);
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stdout);
    return new Promise((resolve) => child.on('close', resolve));
};
