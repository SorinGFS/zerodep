'use strict';
// include common js functions
const fn = require('../../js/fn');
// remember: typeof null === 'object';
module.exports = {
    ...fn,
    // get the hash of a given password
    getPasswordHash: async (password) => {
        return new Promise((resolve, reject) => {
            // generate random 16 bytes long salt
            const salt = require('crypto').randomBytes(16).toString('hex');
            require('crypto').scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                resolve(salt + ':' + derivedKey.toString('hex'));
            });
        });
    },
    // test if the given password is matching the stored hash
    isMatchPasswordHash: (password, hash) => {
        return new Promise((resolve, reject) => {
            const [salt, key] = hash.split(':');
            require('crypto').scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                resolve(require('crypto').timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
            });
        });
    },
    // base64 encode
    btoa: (decoded) => {
        if (Array.isArray(decoded)) return Buffer.from(decoded.join(','), 'binary').toString('base64').replace(/=.*$/, '');
        return Buffer.from(decoded, 'binary').toString('base64').replace(/=.*$/, '');
    },
    // base64 decode
    atob: (b64Encoded) => Buffer.from(b64Encoded, 'base64').toString('utf8'),
};
