var FILE = require('./file');
var IO = require("./io").IO;

const Cc = Components.classes;
const Ci = Components.interfaces;
const DirService = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties)

function getMozFile(path) {
    var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    file.initWithPath(path);
    for (var i=1; i < arguments.length; i++) file.append(arguments[i])
    return file;
}

exports.SEPARATOR = '/';
exports.ROOT = '/';

exports.cwd = function () DirService.get("CurWorkD", Ci.nsIFile).path;

exports.list = function (path) {
    var entries = getMozFile(path).directoryEntries;
    var entryNames = [];
    while(entries.hasMoreElements()) {
        var entry = entries.getNext();
        entry.QueryInterface(Ci.nsIFile);
        entryNames.push(entry.leafName);
    }
    return entryNames;
};

exports.canonical = function (path) {
    var file;
    try {
        file = getMozFile(exports.cwd, path);
    } catch(e) {
        file = getMozFile(path);
    }
    try {
        file.normalize();
    } catch(e) {}
    return file.path;
}

exports.exists = function (path) getMozFile(path).exists();

exports.mtime = function (path) new Date(getMozFile(path).lastModifiedTime);

exports.size = function (path) getMozFile(path).fileSize;

exports.stat = function (path) {
    return {
        mtime: exports.mtime(path),
        size: exports.size(path)
    }
};

exports.isDirectory = function (path) {
    var file = getMozFile(path);
    return file.exists() && file.isDirectory();
}

exports.isFile = function (path) {
    var file = getMozFile(path);
    return file.exists() && file.isFile();
}

exports.isLink = function (path) getMozFile(path).isSymlink();

exports.isReadable = function (path) getMozFile(path).isReadable();

exports.isWritable = function (path) getMozFile(path).isWritable();

exports.rename = function (source, target) {
    source = file.path(source);
    target = source.resolve(target);
    source = getMozFile(source);
    target = getMozFile(target);
    try {
        source.moveTo(target.parent, target.leafName);
    } catch(e) {
        throw new Error("failed to rename " + source.path + " to " + target.path);
    }
};

exports.move = function (source, target) {
    source = file.path(source);
    target = source.resolve(target);
    source = getMozFile(source);
    target = getMozFile(target);
    try {
        source.moveTo(target.parent, target.leafName);
    } catch(e) {
        throw new Error("failed to move " + source.path + " to " + target.path);
    }
};

exports.remove = function (path) {
    try {
        getMozFile(path).remove(false)
    } catch(e) {
        throw new Error("failed to delete " + path);
    }
};

exports.mkdir = function (path) getMozFile(path).create(Ci.nsIFile.NORMAL_FILE_TYPE, 0777);

exports.mkdirs = function (path) getMozFile(path).create(Ci.nsIFile.NORMAL_FILE_TYPE, 0777);

exports.rmdir = function(path) {
    try {
        getMozFile(path).remove(false)
    } catch(e) {
        throw new Error("failed to delete " + path);
    }
};

exports.rmtree = function(path) {
    try {
        getMozFile(path).remove(true)
    } catch(e) {
        throw new Error("failed to delete " + path);
    }
};

exports.touch = function (path, mtime) {
    var file = getMozFile(path);
    if (!file.exists()) file.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
    else file.lastModifiedTime = new Date().getTime().toString();
};

exports.FileIO = function (path, mode, permissions) {
    file = getMozFile(path);

    var {
        read: read,
        write: write,
        append: append,
        update: update
    } = FILE.mode(mode);

    if (update) {
        throw new Error("Updating IO not yet implemented.");
    } else if (write || append) {
        var stream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileOutputStream);
        stream.init(file, -1, -1, 0);
        return new IO(stream, null);
    } else if (read) {
        var stream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        stream.init(file, -1, 0, 0);
        return new IO(stream, null);
    } else {
        throw new Error("Files must be opened either for read, write, or update mode.");
    }
};
