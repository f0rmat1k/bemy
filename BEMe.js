/*
    Add BEM structure from deps
*/
var _ = require('lodash');
var gulp = require('gulp');

var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');
var mkdirp = require('mkdirp');

Promise.promisifyAll(mkdirp);
Promise.promisifyAll(fs);

var action = process.argv[3],
    target = process.argv[2],
    prompt = process.argv[4],
    dirPath = path.dirname(target);

gulp.task('rename', function(){
    var newPath = path.resolve(target, '..') + '/__' + prompt;

    fs
        .renameAsync(target, newPath)
        .then(function(){
            return fs
                .readdirAsync(newPath)
                .map(function(file){
                    var oldElemName = path.basename(target).replace('__', '');

                    var filePath = newPath + '/' + file,
                        //blockName = file.match(/^[a-z]*__/gi),
                        newFilePath = filePath.replace(oldElemName, prompt);

                    return fs
                        .renameAsync(filePath, newFilePath)
                        .then(function(){
                            return renameInFile(newFilePath, oldElemName, prompt);
                        });
                });
        });
});

gulp.task('default', function(){
    fs.statAsync(target).then(function(data){
        if (data.isFile()) {
            var fileType = detectFileType(target);
            switch (fileType) {
                case 'deps':
                    gulp.start('elem-dirs-from-deps');
                    break;
            }

        } else if (data.isDirectory()) {
            var dirType = detectDirType(target);
            switch (dirType) {
                case 'elem':
                    gulp.start('css-from-elem-dir');
                    break;
            }
        }
    });
});

gulp.task('elem-dirs-from-deps', function(cb) {
    return fs
        .readFileAsync(target, 'utf-8')
        .then(depsToObj)
        .then(getElemsListFromDepsObj)
        .map(createElemDir);
        //done
});

gulp.task('css-from-elem-dir', function(cb){
    var elemName = path.basename(target),
        blockName = path.basename(path.resolve(target, '../')),
        cssClassName = blockName + elemName,
        cssFilePath = target + '/' + cssClassName + '.css';

    fs
        .writeFile(cssFilePath, '.' + cssClassName + '\n{\n\n}');
});

switch (action) {
    case 'rename':
        gulp.start('rename');
        break;
    default:
        gulp.start('default');
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

function createElemDir(elemName){
    return mkdirp
        .mkdirpAsync(dirPath + '/__' + elemName)
        .then();
}

function detectFileType(targetFile) {
    var filename = path.basename(targetFile),
        fileType;

    switch (true) {
        case /\.deps\./.test(filename):
            fileType = 'deps';
            break;
    }

    return fileType;
}

function detectDirType(targetDir){
    var dirName = path.basename(targetDir),
        dirType;

    switch (true) {
        case /^(__)/.test(dirName):
            dirType = 'elem';
            break;
    }

    return dirType;
}

function rename(oldDir, newDir) {
    return new Promise(function (resolve, reject) {
        fs.rename(oldDir, newDir, function (err) {
            if (err) {
                reject();
            } else {
                resolve();
            }
        });
    });
}

function renameInFile(filepath, oldString, newString){
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