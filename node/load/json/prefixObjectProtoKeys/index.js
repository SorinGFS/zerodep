'use strict';
// JSON.parse() reviver that prefixes Object.prototype like member names with _
// usually the JSON files created from js are clean, this protection aims the files created in other languages
const prefixObjectProtoKeys = (key, value) => {
    const protoKeys = Object.getOwnPropertyNames(Object.prototype);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.keys(value).forEach((key) => {
            if (protoKeys.includes(key)) {
                value[`_${key}`] = value[key]; // Prefix unsafe key
                delete value[key]; // Remove original unsafe key
            }
        });
    }
    return value;
};

module.exports = prefixObjectProtoKeys;