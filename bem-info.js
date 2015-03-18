var fs = require('fs');
var path = require('path');

module.exports = function(options){
    var info = {},
        trgPath = options.trgPath,
        isFile = options.isFile,
        separators = (options.bem && options.bem.separators) || { elem: '__', mod: '_', modVal: '_'},
        allowedSymbols = options.bem && options.bem['allowed-name-symbols-regexp'] || '[-a-z0-9]';

    try { info.stat = fs.statSync(trgPath); } catch (e) { }

    info.isFile = info.stat && info.stat.isFile() || isFile;
    info.isDir = info.stat && info.stat.isDirectory() || !info.isFile;
    info.type = getTargetType(info.isFile, trgPath, options.bem);
    info.dirName = getDirNameByPath(trgPath, info.isFile);

    info.isBlock = isBlock(info.dirName, separators, options.bem);
    info.isElem = isElem(info.dirName, separators, allowedSymbols);
    info.isMod = isMod(info.dirName, separators, allowedSymbols);

    info.blockName = getBlockName(trgPath, info.isBlock, info.isFile, options.bem, allowedSymbols);
    info.elemName = getElemName(info.isElem, info.isMod, info.dirName, trgPath, options.bem);
    info.modName = getModName(info.isMod, info.dirName);
    info.bemName = getBemName(info.blockName, info.elemName, info.modName, options.bem);

    return info;
};

function getTargetType(isFile, trgPath, bem){
    return isFile ? detectFileType(trgPath) : detectDirType(trgPath, bem);
}

function getDirNameByPath(p, isFile){
    return isFile ? path.basename(path.dirname(p)) : path.basename(p);
}

function isBlock(dirName, separators){
    var regexp = new RegExp('(' + separators.elem + '|' + separators.mod + ')');
    return !regexp.test(dirName);
}

function isElem(dirName, separators, allowedSymbols){
    var regexp = new RegExp('^(' + separators.elem + ')' + allowedSymbols + '+\/?$', 'ig');
    return regexp.test(dirName);
}

function isMod(trgPath, separators, allowedSymbols){
    var regexp = new RegExp('^' + separators.mod + allowedSymbols + '+$', 'ig');
    return regexp.test(trgPath);
}

function getBemName(blockName, elemName, modName){
    return blockName + elemName + modName;
}

function getBlockName(trgPath, isBlock, isFile, bem, allowedSymbols){
    if (isFile) trgPath = path.dirname(trgPath);

    if (isBlock) {
        var blockRegExp = new RegExp('(' + allowedSymbols + '+)\/?$', 'i');
        return trgPath.match(blockRegExp)[1];
    }

    var dirName = path.dirname(trgPath),
        baseName = path.basename(dirName);

    var modSeparator = bem && bem.separators.mod || '_',
        modRegExp = new RegExp(modSeparator, 'g');
    if (modRegExp.test(baseName)) return getBlockName(path.resolve(trgPath, '../'));

    return baseName;
}

function getElemName(isElem, isMod, dirName, trgPath, bem){
    if (isElem) return dirName;

    if (isMod) {
        var parentDir = path.basename(path.resolve(trgPath, '../')),
            elemSeparator = bem && bem.separators.elem || '__',
            elemRegExp = new RegExp('^(' + elemSeparator + ')', 'ig'),
            parentIsElem = elemRegExp.test(parentDir);

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

function detectDirType(targetDir, bem){
    var dirName = path.basename(targetDir),
        dirType,
        elemRegExp = new RegExp(bem && bem.separators.elem || '__'),
        modRegExp = new RegExp(bem && bem.separators.mod || '_');

    if (elemRegExp.test(dirName)) {
        dirType = 'elemDir';
    } else if (modRegExp.test(dirName)) {
        dirType = 'modDir';
    } else dirType = 'blockDir';

    return dirType;
}
