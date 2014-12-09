var gulp = require('gulp');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('fs');
var mkdirp = require('mkdirp');
var minimist = require('minimist');
var path = require('path');

Promise.promisifyAll(mkdirp);
Promise.promisifyAll(fs);

var options = minimist(process.argv.slice(2)),
    trgPath = options.f;
    prompt = typeof options.p === 'string' ? options.p.split(' ') : null;

var BEM_INFO = function(){
    var info = {};

    info.stat = fs.statSync(trgPath);
    info.type = getTargetTypeByStat(info.stat);
    info.isDir = info.stat.isDirectory();
    info.isFile = info.stat.isFile();
    info.dirName = getDirName(info);
    info.isBlock = isBlock(info);
    info.isElem = isElem(info);
    info.blockName = getBlockName(null, info);
    info.elemName = getElemName(info);
    info.bemName = getBemName(info);

    return info;
}();

var SUFFIXES = {
    css: '.css',
    js: '.js',
    deps: '.deps.js',
    bh: '.bh.js'
};

var DEFAULT_ACTIONS = {
        depsFile: 'elem-dirs-from-deps',
        elemDir: 'css-from-elem-dir'
    },
    FILE_TEMPLATES = {
        js: 'js-template.js',
        css: 'css-template.css',
        bh: 'bh-template.js',
        deps: 'deps-template.js'
    };

gulp.task('default', function(){
    return fs
        .statAsync(trgPath)
        .then(getTargetTypeByStat)
        .then(chooseActionByDefault);
});

gulp.task('create', function(){
    return fs
        .statAsync(trgPath)
        .then(getTargetTypeByStat)
        .then(startCreating)
        .then(function(){
            console.log('done!');
        });
});

gulp.task('elem-dirs-from-deps', function(){
    return fs
        .readFileAsync(trgPath, 'utf-8')
        .then(depsToObj)
        .then(getElemsListFromDepsObj)
        .map(createElemsDirs);
});

gulp.task('css-from-elem-dir', function(){
    var elemName = path.basename(trgPath),
        blockName = path.basename(path.resolve(trgPath, '../')),
        cssClassName = blockName + elemName,
        cssFilePath = trgPath + '/' + cssClassName + '.css';

    fs
        .writeFile(cssFilePath, '.' + cssClassName + '\n{\n\n}');
});

//todo refactor
gulp.task('rename', function(){
    newName = prompt[0];
    var newPath = path.resolve(trgPath, '..') + '/__' + newName;

    fs
        .renameAsync(trgPath, newPath)
        .then(function(){
            return fs
                .readdirAsync(newPath)
                .map(function(file){
                    var oldElemName = path.basename(trgPath).replace('__', '');

                    var filePath = newPath + '/' + file,
                        newFilePath = filePath.replace(oldElemName, newName);

                    return fs
                        .renameAsync(filePath, newFilePath)
                        .then(function(){
                            return renameCssClassesInFile(newFilePath, oldElemName, newName);
                        });
                });
        });
});

function getBemName(info){
    if (info.isBlock) return info.blockName;
    if (info.isElem) return info.blockName + info.elemName;
}

function getDirName(info){
    if (info.isDir) {
        return trgPath.match(/[-a-z0-9_]+$/ig)[0];
    }
}

function isBlock(info){
    if (info.isFile) return;

    var isBlock = /\/[^_][-a-z0-9]+$/i.test(trgPath);
    return isBlock || false;
}

function isElem(info){
    if (info.isFile) return;
    return /__[-a-z0-9]+$/ig.test(trgPath);
}

function getBlockName(targetPath, info){
    targetPath = targetPath || trgPath;

    if (info && info.isBlock) return targetPath.match(/[-a-z0-9]+$/i)[0];

    var dirName = path.dirname(targetPath),
    baseName = path.basename(dirName);

    if (/_/g.test(baseName)) {
        return getBlockName(path.resolve(targetPath, '../'));
    } else {
        return baseName;
    }
}

function getElemName(info){
    if (info.isBlock) return '';
    if (info.isElem) return info.dirName;

    return '';
}

function startCreating(targetType){
    return Promise.map(prompt, function(fileType){
        return createFileFromTemplate(fileType);
    });
}

function createFileFromTemplate(fileType){
    var tmp = FILE_TEMPLATES[fileType],
        file = insertName(getTemplate(tmp));

    createFile(file, fileType);

    //return getTemplate(tmp)
    //    .then(insertName)
    //    .then(createFile);
}

function insertName(file){
    return file
        .replace('{{blockName}}', BEM_INFO.blockName)
        .replace('{{elemName}}', BEM_INFO.elemName);
}

function getTargetTypeByStat(stat){
    if (stat.isFile()) {
        return detectFileType(trgPath);
    } else if (stat.isDirectory()) {
        return detectDirType(trgPath);
    }
}

function detectFileType(targetFile) {
    var filename = path.basename(targetFile),
        fileType;

    switch (true) {
        case /\.deps\./.test(filename):
            fileType = 'depsFile';
            break;
    }

    return fileType;
}

function detectDirType(targetDir){
    var dirName = path.basename(targetDir),
        dirType;

    switch (true) {
        case /^__/.test(dirName):
            dirType = 'elemDir';
            break;
        case /^_/.test(dirName):
            dirType = 'modDir';
            break;

        default:
            dirType = 'blockDir';
    }

    return dirType;
}

function chooseActionByDefault(targetType){
    gulp.start(DEFAULT_ACTIONS[targetType]);
}

function depsToObj(data){
    return (0, eval( '[' + data + ']' )[0]);
}

function getElemsListFromDepsObj(data) {
    var mustElems = getElemsFormDeps(data.mustDeps),
        shouldElems = getElemsFormDeps(data.shouldDeps);

    return mustElems.concat(shouldElems);
}

function getElemsFormDeps(deps) {
    //todo Подумать, как сделать лучше
    var elemsObj = _.find(deps, 'elems'),
        singleElems = [],
        resultElemList = [];

    deps.forEach(function(item){
        if (item['elem']) singleElems.push(item['elem']);
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
    return mkdirp.mkdirpAsync(blockDir + '/__' + elemName);
}

function renameCssClassesInFile(filepath, oldString, newString){
    return new Promise(function (resolve, reject) {
        if (path.extname(filepath) === '.css') {
            return fs
                .readFileAsync(filepath, 'utf-8')
                .then(function(data){
                    var re = new RegExp(oldString, 'g');
                    return data.replace(re, newString);
                })
                .then(function(newFile){
                    return fs.writeFileAsync(filepath, newFile);
                });
        }
    });
}

function createFile(file, type, path){
    path = (path || trgPath) + '/' + BEM_INFO.bemName + SUFFIXES[type];
    fs.writeFileSync(path, file);
}

function getTemplate(tmpName){
    return fs.readFileSync('tmp/' + tmpName, 'utf-8');
}
