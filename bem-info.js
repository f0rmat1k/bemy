var fs = require('fs');
var path = require('path');

module.exports = function(trgPath, isFile){
    var info = {};

    try { info.stat = fs.statSync(trgPath); } catch (e) { }

    info.isFile = info.stat && info.stat.isFile() || isFile;
    info.isDir = info.stat && info.stat.isDirectory() || !info.isFile;
    info.type = getTargetType(info.isFile, trgPath);
    info.dirName = getDirNameByPath(trgPath, info.isFile);

    info.isBlock = isBlock(info.dirName);
    info.isElem = isElem(info.dirName);
    info.isMod = isMod(info.dirName);

    info.blockName = getBlockName(trgPath, info.isBlock, info.isFile);
    info.elemName = getElemName(info.isElem, info.isMod, info.dirName, trgPath);
    info.modName = getModName(info.isMod, info.dirName);
    info.bemName = getBemName(info.blockName, info.elemName, info.modName);

    return info;
};

function getTargetType(isFile, trgPath){
    return isFile ? detectFileType(trgPath) : detectDirType(trgPath);
}

function getDirNameByPath(p, isFile){
    return isFile ? path.basename(path.dirname(p)) : path.basename(p);
}

function isBlock(dirName){
    return !/^_/i.test(dirName);
}

function isElem(dirName){
    return /^(__)[-a-z0-9]+\/?$/ig.test(dirName);
}

function isMod(trgPath){
    return /^_[-a-z0-9]+$/ig.test(trgPath);
}

function getBemName(blockName, elemName, modName){
    return blockName + elemName + modName;
}

function getBlockName(trgPath, isBlock, isFile){
    if (isFile) trgPath = path.dirname(trgPath);
    if (isBlock) return trgPath.match(/([-a-z0-9]+)\/?$/i)[1];

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
    var filename = path.basename(targetFile);

    if (/\.deps\./.test(filename)) return 'deps';
    if (/\.css$/.test(filename)) return 'css';
    if (/\.priv\.js$/.test(filename)) return 'priv';
    if (/\.bh\.js$/.test(filename)) return 'bh';
    if (/\.js$/.test(filename)) return 'js';
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
