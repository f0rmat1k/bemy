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
    trgPath = options.f,
    prompt = options.p;

var DEFAULT_ACTIONS = {
    depsFile: 'elem-dirs-from-deps',
    elemDir: 'css-from-elem-dir'
};

gulp.task('default', function(){
    return fs
        .statAsync(trgPath)
        .then(detectTargetTypeByStat)
        .then(chooseActionByDefault);
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

gulp.task('rename', function(){
    var newPath = path.resolve(trgPath, '..') + '/__' + prompt;

    fs
        .renameAsync(trgPath, newPath)
        .then(function(){
            return fs
                .readdirAsync(newPath)
                .map(function(file){
                    var oldElemName = path.basename(trgPath).replace('__', '');

                    var filePath = newPath + '/' + file,
                        newFilePath = filePath.replace(oldElemName, prompt);

                    return fs
                        .renameAsync(filePath, newFilePath)
                        .then(function(){
                            return renameCssClassesInFile(newFilePath, oldElemName, prompt);
                        });
                });
        });
});

function detectTargetTypeByStat(stat){
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
        case /^(__)/.test(dirName):
            dirType = 'elemDir';
            break;
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