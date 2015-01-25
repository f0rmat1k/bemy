'use strict';

var _ = require('lodash'); //todo
var fs = require('fs');
var minimist = require('minimist');
var path = require('path');
var exec = require('child_process').exec;

var options = minimist(process.argv.slice(2)),
    trgPath = options.f,
    prompt = typeof options.p === 'string' ? options.p.split(' ') : null,
    BEM_INFO = require('./bem-info.js')(trgPath),
    config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

var SUFFIXES = config.suffixes,
    FILE_TEMPLATES = config['file-templates'],
    DEFAULT_ACTIONS = {
        blockDir: startCreating.bind(null, ['css']),
        depsFile: createElemDirsByDeps,
        elemDir: startCreating.bind(null, ['css']),
        modDir: startCreating.bind(null, ['css'])
    },
    tasks = {
        auto: DEFAULT_ACTIONS[BEM_INFO.type],
        create: startCreating.bind(this, prompt)
    };

var task = options.t || 'auto';
tasks[task]();

function createElemDirsByDeps(){
    var file = fs.readFileSync(trgPath, 'utf-8'),
        depsObj = depsToObj(file),
        elemsList = getElemsListFromDepsObj(depsObj);

    elemsList.forEach(createElemsDir);
}

// todo
function startCreating(fileTypes){
    return fileTypes.forEach(createFileFromTemplate);
}

function createFileFromTemplate(fileType){
    var tmpPath = FILE_TEMPLATES[fileType],
        file = insertName(getTemplate(tmpPath));

    createFile(file, fileType);
}

function insertName(file){
    return file
        .replace(/{{blockName}}/g, BEM_INFO.blockName)
        .replace(/{{elemName}}/g, BEM_INFO.elemName)
        .replace(/{{modName}}/g, BEM_INFO.modName);
}

function depsToObj(data){
    return eval(data);
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

function createElemsDir(elemName){
    var blockDir = path.dirname(trgPath),
        p = path.join(blockDir, '__' + elemName);

    if (!fs.existsSync(p)) fs.mkdirSync(p);
}

function createFile(file, type){
    var p = path.join(trgPath, BEM_INFO.bemName + SUFFIXES[type]);

    fs.writeFileSync(p, file);

    if (options.g) gitAddTrg();
}

function getTemplate(tmpPath){
    return fs.readFileSync(tmpPath, 'utf-8');
}

function gitAddTrg(){
    exec('cd ' + trgPath + ' && git add ' + trgPath, function (error, stdout, stderr) {
        if (stderr) console.log(stderr);
    });
}
