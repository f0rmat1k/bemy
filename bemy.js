'use strict';

var fs = require('fs');
var minimist = require('minimist');
var path = require('path');
var exec = require('child_process').exec;
var depsNormalize = require('deps-normalize');

var options = minimist(process.argv.slice(2)),
    trgPath = options.f,
    configPath = options.c || 'config.json',
    prompt = options.p ? options.p.toString().split(/\s/) : '',
    bemInfo = require('./bem-info.js'),
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

var BEM_INFO = bemInfo(trgPath),
    SUFFIXES = config.suffixes,
    FILE_TEMPLATES = config['file-templates'],
    DEFAULT_ACTIONS = {
        blockDir: startCreating.bind(this, ['css']),
        deps: createStructureByDeps,
        elemDir: startCreating.bind(this, ['css']),
        modDir: startCreating.bind(this, ['css'])
    },
    tasks = {
        auto: DEFAULT_ACTIONS[BEM_INFO.type],
        create: startCreating.bind(this, prompt),
        rename: renameBemNode.bind(this, prompt[0], trgPath)
    };

var task = options.t || 'auto';
tasks[task]();

function renameBemNode(newName, nodePath, basename){
    if (!valdateBemName(newName)) {
        console.error('Invalid name: ' + newName);
        return;
    }

    var info = bemInfo(nodePath);

    basename = basename || {
        type: info.type,
        name : newName
    };

    if (info.isFile) {

    }

    return;

    var info = bemInfo(nodePath),
        nodeName;

    if (info.isBlock) {
        nodeName = info.blockName;
    } else if (info.isElem) {
        nodeName = info.elemName
    } else if (info.isMod) {
        nodeName = info.modName
    }

    var nodePath2 = nodePath;
    //rename own files
    fs.readdirSync(nodePath2).forEach(function(node){

        var nodePath = path.join(nodePath2, node);
        var info = bemInfo(nodePath);
        if (info.isFile) {
            var oldFileName = path.basename(nodePath),
                newFileName = oldFileName.replace(BEM_INFO.blockName, newName),
                newPath = nodePath.replace(oldFileName, newFileName);
            console.log(newPath);
            fs.renameSync(nodePath, newPath);
        } else {
            renameBemNode(newName, nodePath);
        }
    });

    //rename block name
    //renameDir(nodePath, newName, BEM_INFO.blockName);
}

function renameDir(nodePath, newName, oldName){
    var newPath = nodePath.replace(oldName, newName);
    fs.renameSync(nodePath, newPath);
}

function valdateBemName(name){
    return !/[^-a-z0-9]/ig.test(name);
}

function startCreating(fileTypes){
    return fileTypes.forEach(function(fileType){
        createFileFromTemplate(fileType);
    });
}

function createFileFromTemplate(fileType, trg, modVal){
    trg = trg || trgPath;

    var tmpPath = FILE_TEMPLATES[fileType],
        file = insertName(getTemplate(tmpPath), trg, modVal);

    createFile(file, fileType, trg, modVal);
}

function insertName(file, trg, modVal){
    var info = bemInfo(trg);

    return file
        .replace(/{{blockName}}/g, info.blockName)
        .replace(/{{elemName}}/g, info.elemName)
        .replace(/{{modName}}/g, info.modName)
        .replace(/{{modVal}}/g, modVal || '');
}

function createStructureByDeps(){
    var file = fs.readFileSync(trgPath, 'utf-8'),
        depsObj = depsToObj(file),
        structureList = getNormalaizedDeps(depsObj);

    structureList.forEach(createNode);
}

function createNode(nodeObj){
    if (nodeObj['block'] && nodeObj['block'] !== BEM_INFO.blockName) return;

    var blockDir = path.dirname(trgPath),
        nodePath,
        fileTypes = config.deps_task ? config.deps_task.files : [],

    modVal = nodeObj.modVal ? '_' + nodeObj.modVal : '';

    if (nodeObj.elem) {
        nodePath = path.join(blockDir, '__' + nodeObj.elem);

        if (!fs.existsSync(nodePath)) {
            fs.mkdirSync(nodePath);

            fileTypes.forEach(function(type){
                createFileFromTemplate(type, nodePath);
            });
        }

        if (nodeObj.modName) {
            nodePath = path.join(nodePath, '_' + nodeObj.modName);

            if (!fs.existsSync(nodePath)) {
                fs.mkdirSync(nodePath);
            }

            fileTypes.forEach(function(type){
                createFileFromTemplate(type, nodePath, modVal);
            });
        }
    } else {
        nodePath = path.join(blockDir, '_' + nodeObj.modName);
        if (!fs.existsSync(nodePath)) {
            fs.mkdirSync(nodePath);

            fileTypes.forEach(function(type){
                createFileFromTemplate(type, nodePath, modVal);
            });
        }
    }
}

function depsToObj(data){
    return eval(data);
}

function getNormalaizedDeps(data) {
    var mustDeps = depsNormalize(data.mustDeps, { parseString: parseString }),
        shouldDeps = depsNormalize(data.shouldDeps, { parseString: parseString });

    return mustDeps.concat(shouldDeps);
}

function createFile(file, type, trg, modVal){
    trg = trg || trgPath;
    modVal = modVal || '';

    var info = bemInfo(trg),
        p = path.join(trg, info.bemName + modVal + SUFFIXES[type]);

    if (!fs.existsSync(p)) {
        fs.writeFileSync(p, file);
    }

    if (options.g) gitAddTrg(trg, p);
}

function getTemplate(tmpPath){
    return fs.readFileSync(tmpPath, 'utf-8');
}

function gitAddTrg(dir, file){
    exec('cd ' + dir + ' && git add ' + file, function (error, stdout, stderr) {
        if (stderr) console.error(stderr);
    });
}

function parseString(dep) {
    var obj = {};

    var block = (dep.match(/[-a-z0-9]+/i) || [])[0],
        elem = (dep.match(/^[-a-z0-9]+__([-a-z0-9]+)/i) || [])[1],
        modName = (dep.match(/^[-a-z0-9]+__[-a-z0-9]+_([-a-z0-9]+)/i) || [])[1],
        modVal = (dep.match(/^[-a-z0-9]+__[-a-z0-9]+_[-a-z0-9]+_([-a-z0-9]+)$/i) || [])[1];

    block && (obj['block'] = block);
    elem && (obj['elem'] = elem);
    modName && (obj['modName'] = modName);
    modVal && (obj['modVal'] = modVal);

    return obj;
}
