var fs = require('fs');
var path = require('path');

// todo write to blond (bem-walk)
module.exports = function(trgPath){
    var info = {};

    info.stat = fs.statSync(trgPath);
    info.type = getTargetTypeByStat(info.stat, trgPath);
    info.isDir = info.stat.isDirectory();
    info.isFile = info.stat.isFile();
    info.dirName = getDirNameByPath(trgPath);

    if (!info.isFile) {
        info.isBlock = isBlock(trgPath);
        info.isElem = isElem(trgPath);
        info.isMod = isMod(trgPath);
    }

    info.blockName = getBlockName(trgPath, info.isBlock);
    info.elemName = getElemName(info.isElem, info.isMod, info.dirName, trgPath);
    info.modName = getModName(info.isMod, info.dirName);
    info.bemName = getBemName(info.blockName, info.elemName, info.modName);

    return info;
};

function getTargetTypeByStat(stat, trgPath){
    return stat.isFile() ? detectFileType(trgPath) : detectDirType(trgPath);
}

function getDirNameByPath(p){
    return path.basename(p);
}

function isBlock(trgPath){
    return /\/[^_][-a-z0-9]+$/i.test(trgPath);
}

function isElem(trgPath){
    return /__[-a-z0-9]+$/ig.test(trgPath);
}

function isMod(trgPath){
    return /\/_[-a-z0-9]+$/ig.test(trgPath);
}

function getBemName(blockName, elemName, modName){
    return blockName + elemName + modName;
}

function getBlockName(trgPath, isBlock){
    if (isBlock) return trgPath.match(/[-a-z0-9]+$/i)[0];

    var dirName = path.dirname(trgPath),
        baseName = path.basename(dirName);

    if (/_/g.test(baseName)) return getBlockName(path.resolve(trgPath, '../'));

    return baseName;
}

function getElemName(isElem, isMod, dirName, trgPath){
    if (isElem) return dirName;

    if (isMod) {
        var parentDir = path.basename(path.resolve(trgPath, '../')),
            parentIsElem = /^(__)/ig.test(parentDir);
        if (parentIsElem) return parentDir;
    }

    return '';
}

function getModName(isMod, dirName){
    return isMod ? dirName : '';
}

function detectFileType(targetFile) {
    var filename = path.basename(targetFile),
        fileType;

    if (/\.deps\./.test(filename)) fileType = 'depsFile';

    return fileType;
}

function detectDirType(targetDir){
    var dirName = path.basename(targetDir),
        dirType;

    if (/^__/.test(dirName)) {
        dirType = 'elemDir';
    } else if (/^_/.test(dirName)) {
        dirType = 'modDir';
    } else dirType = 'blockDir';

    return dirType;
}