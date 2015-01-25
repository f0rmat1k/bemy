var _ = require('lodash'); // todo
var fs = require('fs');
var minimist = require('minimist');
var path = require('path');

var options = minimist(process.argv.slice(2)),
    trgPath = options.f;
    prompt = typeof options.p === 'string' ? options.p.split(' ') : null;

var BEM_INFO = require('./bem-info.js')(trgPath);

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

var tasks = {
    auto: DEFAULT_ACTIONS[BEM_INFO.type],
    create: startCreating.bind(this, prompt)
};

tasks[options.t]();

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
    var blockDir = path.dirname(trgPath);
    fs.mkdirSync(path.join(blockDir, '__' + elemName));
}

function createFile(file, type, p){
    p = path.join((p || trgPath), BEM_INFO.bemName + SUFFIXES[type]);

    fs.writeFileSync(p, file);
}

function getTemplate(tmpName){
    return fs.readFileSync(path.join('tmp', tmpName), 'utf-8');
}
