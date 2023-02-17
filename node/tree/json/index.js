'use strict';
// load json files in tree
import load from '../load';

const loader = (...pathResolveArgs) => {
    const file = String(pathResolveArgs.slice(-1));
    if (['json'].includes(file.split('.').pop())) {
        return { [file.split('.').slice(0, -1).join('.')]: require(fs.pathResolve(...pathResolveArgs)) };
    }
};

export default (...pathResolveArgs) => load(loader, ...pathResolveArgs);
