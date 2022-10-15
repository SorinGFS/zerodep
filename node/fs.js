'use strict';
// base fileSystem functions
const fs = require('fs');
const path = require('path');

module.exports = {
    buffersAreEqual: function (buffer1, buffer2) {
        return buffer1.equals(buffer2);
    },
    pathResolve: function (...args) {
        return path.resolve(...args);
    },
    pathJoin: function (...args) {
        return path.join(...args);
    },
    pathDirName: function (file) {
        return path.dirname(file);
    },
    pathBaseName: function (file) {
        return path.basename(file);
    },
    pathExtName: function (file) {
        return path.extname(file);
    },
    entries: function (...pathResolveArgs) {
        return fs.readdirSync(path.resolve(...pathResolveArgs));
    },
    files: function (...pathResolveArgs) {
        return fs.readdirSync(path.resolve(...pathResolveArgs)).filter((file) => fs.lstatSync(path.resolve(...pathResolveArgs, file)).isFile());
    },
    dirs: function (...pathResolveArgs) {
        return fs.readdirSync(path.resolve(...pathResolveArgs)).filter((file) => fs.lstatSync(path.resolve(...pathResolveArgs, file)).isDirectory());
    },
    links: function (...pathResolveArgs) {
        return fs.readdirSync(path.resolve(...pathResolveArgs)).filter((file) => fs.lstatSync(path.resolve(...pathResolveArgs, file)).isSymbolicLink());
    },
    exists: function (...pathResolveArgs) {
        return fs.existsSync(path.resolve(...pathResolveArgs));
    },
    isFile: function (...pathResolveArgs) {
        return this.exists(...pathResolveArgs) && fs.lstatSync(path.resolve(...pathResolveArgs)).isFile();
    },
    isDirectory: function (...pathResolveArgs) {
        return this.exists(...pathResolveArgs) && fs.lstatSync(path.resolve(...pathResolveArgs)).isDirectory();
    },
    isLink: function (...pathResolveArgs) {
        return this.exists(...pathResolveArgs) && fs.lstatSync(path.resolve(...pathResolveArgs)).isSymbolicLink();
    },
    isSocket: function (...pathResolveArgs) {
        return this.exists(...pathResolveArgs) && fs.lstatSync(path.resolve(...pathResolveArgs)).isSocket();
    },
    link: function (target, link) {
        // if target is dir use linkDir function
        if (fs.lstatSync(target).isDirectory()) return this.linkDir(target, link);
        // unlink if different
        try {
            const bufTarget = fs.readFileSync(target);
            const bufLink = fs.readFileSync(link);
            if (bufTarget.equals(bufLink)) {
                return;
            } else {
                this.unlink(link);
            }
        } catch (error) {
            console.log(`Linking ${target}...`);
        }
        // if reached here file is not linked
        try {
            fs.symlinkSync(target, link);
        } catch (error) {
            console.log(error.message);
        }
    },
    linkDir: function (target, link) {
        // if target is file use link function
        if (fs.lstatSync(target).isFile()) return this.link(target, link);
        // unlink if there is no match
        try {
            let bufTarget, bufLink, found;
            ['index.js', 'index.json', 'index.cjs', 'index.mjs'].forEach((file) => {
                if (this.exists(target, file)) {
                    bufTarget = fs.readFileSync(path.resolve(target, file));
                    bufLink = fs.readFileSync(path.resolve(link, file));
                    if (bufTarget.equals(bufLink)) found = true;
                }
            });
            if (found) {
                return;
            } else {
                this.unlink(link);
            }
        } catch (error) {
            console.log(`Linking ${target}...`);
        }
        // if reached here file is not linked
        try {
            fs.symlinkSync(target, link);
        } catch (error) {
            console.log(error.message);
        }
    },
    unlink: function (...pathResolveArgs) {
        if (fs.existsSync(path.resolve(...pathResolveArgs)) && fs.lstatSync(path.resolve(...pathResolveArgs)).isSymbolicLink()) {
            try {
                fs.unlinkSync(path.resolve(...pathResolveArgs));
            } catch (error) {
                console.log(error);
            }
        }
    },
    chdir: function (...pathResolveArgs) {
        return process.chdir(path.resolve(...pathResolveArgs));
    },
    mkdir: function (...pathResolveArgs) {
        return fs.mkdirSync(path.resolve(...pathResolveArgs), { recursive: true });
    },
    readFile: function (file, options) {
        // If options.encoding is specified then returns a string. Otherwise it returns a buffer.
        try {
            return fs.readFileSync(file, options);
        } catch (error) {
            console.log(error);
        }
    },
    writeFile: function (file, content, printSuccess = false) {
        if (process.env.NODE_ENV) throw new Error("Can't run inside a started app!");
        try {
            this.mkdir(this.pathDirName(file));
            fs.writeFileSync(file, content);
            if (printSuccess) console.log(`File ${file} written successfully.`);
        } catch (error) {
            console.log(error);
        }
    },
    appendFile: function (file, content, printSuccess = false) {
        if (process.env.NODE_ENV) throw new Error("Can't run inside a started app!");
        try {
            this.mkdir(this.pathDirName(file));
            fs.appendFileSync(file, content);
            if (printSuccess) console.log(`File ${file} updated successfully.`);
        } catch (error) {
            console.log(error);
        }
    },
    removeFile: function (...pathResolveArgs) {
        if (fs.existsSync(path.resolve(...pathResolveArgs)) && fs.lstatSync(path.resolve(...pathResolveArgs)).isFile()) {
            try {
                fs.unlinkSync(path.resolve(...pathResolveArgs));
            } catch (error) {
                console.log(error);
            }
        }
    },
    removeDir: function (...pathResolveArgs) {
        fs.rmSync(path.resolve(...pathResolveArgs), { recursive: true });
    },
    removeDirContent: function (...pathResolveArgs) {
        let entries;
        try {
            entries = fs.readdirSync(path.resolve(...pathResolveArgs));
        } catch (e) {
            return;
        }
        if (entries.length > 0) {
            for (let i = 0; i < entries.length; i++) {
                const filePath = path.resolve(...pathResolveArgs, entries[i]);
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                } else {
                    this.removeDirContent(filePath);
                }
            }
        }
    },
};
