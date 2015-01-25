// TODO PATH JOIN

var gulp = require('gulp');
var _ = require('lodash'); // todo
var fs = require('fs');
var minimist = require('minimist');
var path = require('path');

var options = minimist(process.argv.slice(2)),
    trgPath = options.f;
    prompt = typeof options.p === 'string' ? options.p.split(' ') : null;

// todo write to blond (bem-walk)
var BEM_INFO = function(){
    var info = {};

    info.stat = fs.statSync(trgPath);
    info.type = getTargetTypeByStat(info.stat);
    info.isDir = info.stat.isDirectory();
    info.isFile = info.stat.isFile();
    info.dirName = getDirNameByPath(trgPath);

    if (!info.isFile) {
        info.isBlock = isBlock();
        info.isElem = isElem();
        info.isMod = isMod();
    }

    info.blockName = getBlockName(null, info.isBlock);
    info.elemName = getElemName(info.isElem, info.isMod, info.dirName);
    info.modName = getModName(info.isMod, info.dirName);
    info.bemName = getBemName(info.blockName, info.elemName, info.modName);

    return info;
}();

var SUFFIXES = {
    css: '.css',
    c: '.css',
    js: '.js',
    j: '.js',
    deps: '.deps.js',
    d: '.deps.js',
    bh: '.bh.js',
    b: '.bh.js',
    priv: '.priv.js',
    p: '.priv.js'
};

var DEFAULT_ACTIONS = {
        blockDir: startCreating.bind(null, ['css']),
        depsFile: createElemDirsByDeps,
        elemDir: startCreating.bind(null, ['css']),
        modDir: startCreating.bind(null, ['css'])
    },
    FILE_TEMPLATES = {
        js: 'js-template.js',
        j: 'js-template.js',
        css: 'css-template.css',
        c: 'css-template.css',
        bh: 'bh-template.js',
        b: 'bh-template.js',
        deps: 'deps-template.js',
        d: 'deps-template.js',
        priv: 'priv-template.js',
        p: 'priv-template.js'
    };

gulp.task('default', function(){
    DEFAULT_ACTIONS[BEM_INFO.type]();
});

gulp.task('create', function(){
    // todo
    startCreating(prompt);
});

function createElemDirsByDeps(){
    var file = fs.readFileSync(trgPath, 'utf-8'),
        depsObj = depsToObj(file),
        elemsList = getElemsListFromDepsObj(depsObj);

    createElemsDirs(elemsList);
}

function getBemName(blockName, elemName, modName){
    return blockName + elemName + modName;
}

function isBlock(){
    return /\/[^_][-a-z0-9]+$/i.test(trgPath);
}

function isElem(){
    return /__[-a-z0-9]+$/ig.test(trgPath);
}

function isMod(){
    return /\/_[-a-z0-9]+$/ig.test(trgPath);
}

function getBlockName(targetPath, isBlock){
    targetPath = targetPath || trgPath;

    if (isBlock) return targetPath.match(/[-a-z0-9]+$/i)[0];

    var dirName = path.dirname(targetPath),
        baseName = path.basename(dirName);

    if (/_/g.test(baseName)) return getBlockName(path.resolve(targetPath, '../'));

    return baseName;
}

function getElemName(isElem, isMod, dirName){
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

// todo
function startCreating(fileTypes){
    return fileTypes.forEach(createFileFromTemplate);
}

function createFileFromTemplate(fileType){
    var tmp = FILE_TEMPLATES[fileType],
        file = insertName(getTemplate(tmp));

    createFile(file, fileType);
}

function insertName(file){
    return file
        .replace(/{{blockName}}/g, BEM_INFO.blockName)
        .replace(/{{elemName}}/g, BEM_INFO.elemName)
        .replace(/{{modName}}/g, BEM_INFO.modName);
}

function getTargetTypeByStat(stat){
    return stat.isFile() ? detectFileType(trgPath) : detectDirType(trgPath);
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

function depsToObj(data){
    return (0, eval(data));
}

function getElemsListFromDepsObj(data) {
    var mustElems = getElemsFormDeps(data.mustDeps),
        shouldElems = getElemsFormDeps(data.shouldDeps);

    return mustElems.concat(shouldElems);
}

function getElemsFormDeps(deps) {
    if (!deps) return [];

    //todo Подумать, как сделать лучше
    var elemsObj = _.find(deps, 'elems'),
        singleElems = [],
        resultElemList = [];

    deps.forEach(function(item){
        if (item['elem'] && !item['block']) singleElems.push(item['elem']);
    });

    if (elemsObj) {
        resultElemList = singleElems.concat(elemsObj['elems']);
    } else {
        resultElemList = singleElems;
    }

    return resultElemList;
}

function createElemsDirs(elemName){
    var blockDir = path.dirname(trgPath);
    fs.mkdirSync(blockDir + '/__' + elemName);
}

function createFile(file, type, path){
    path = (path || trgPath) + '/' + BEM_INFO.bemName + SUFFIXES[type];
    fs.writeFileSync(path, file);
}

function getTemplate(tmpName){
    return fs.readFileSync('tmp/' + tmpName, 'utf-8');
}

function getDirNameByPath(p){
    return path.basename(p);
}