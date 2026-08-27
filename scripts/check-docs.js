// Verify that every runtime export and documented entry point remains represented in the API references.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const common = require(path.join(projectRoot, 'js/fn'));
const browser = require(path.join(projectRoot, 'browser/fn'));
const nodeFunctions = require(path.join(projectRoot, 'node/fn'));
const fileSystem = require(path.join(projectRoot, 'node/fs'));

// Read one project-relative document as the authoritative coverage surface for its export group.
function readDocument(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

// Identify one environment-specific name that is absent from the common namespace.
function isAdditionalExport(name) {
    return !Object.hasOwn(common, name);
}

// Return only exports added by an environment-specific namespace beyond the common namespace.
function additionalExports(namespace) {
    return Object.keys(namespace).filter(isAdditionalExport);
}

// Format one missing coverage item for the final diagnostic.
function formatMissingItem(item) {
    return `- ${item}`;
}

// Count every documented binding across the separate entry-point groups.
function countBindings(total, group) {
    return total + group.names.length;
}

const groups = [
    { document: 'docs/common-functions.md', names: Object.keys(common) },
    { document: 'docs/browser-functions.md', names: additionalExports(browser) },
    { document: 'docs/node-functions.md', names: additionalExports(nodeFunctions) },
    { document: 'docs/filesystem.md', names: Object.keys(fileSystem) }
];
const missing = [];

// Require one signature-shaped reference for every object export.
for (const group of groups) {
    const content = readDocument(group.document);

    // Match every export in this group to its signature-shaped documentation token.
    for (const name of group.names) {
        if (!content.includes(`\`${name}(`)) {
            missing.push(`${group.document}: ${name}`);
        }
    }
}

const readme = readDocument('readme.md');
const entryPoints = [
    'js/fn/index.js',
    'browser/fn/index.js',
    'node/fn/index.js',
    'node/fs/index.js',
    'node/load/index.js',
    'node/load/js/index.js',
    'node/load/json/index.js',
    'node/load/json/prefixObjectProtoKeys/index.js',
    'node/access/index.js',
    'node/action/index.js',
    'node/exec/index.js'
];

// Verify entry-point files still exist and their import paths remain discoverable from the README or references.
for (const entryPoint of entryPoints) {
    if (!fs.existsSync(path.join(projectRoot, entryPoint))) {
        missing.push(`missing entry-point file: ${entryPoint}`);
        continue;
    }
    const importPath = entryPoint.replace(/\/index\.js$/, '');
    const documented = readme.includes(`zerodep/${importPath}`)
        || readDocument('docs/loaders-and-access.md').includes(`zerodep/${importPath}`)
        || readDocument('docs/action-and-exec.md').includes(`zerodep/${importPath}`);
    if (!documented) {
        missing.push(`undocumented entry point: zerodep/${importPath}`);
    }
}

if (missing.length > 0) {
    throw new Error(`Documentation coverage failed:\n${missing.map(formatMissingItem).join('\n')}`);
}

console.log(`Documentation covers ${groups.reduce(countBindings, 0)} object-export bindings and ${entryPoints.length} entry points.`);
