#!/usr/bin/env node

'use strict';

var fs = require('fs');
var minimist = require('minimist');
var path = require('path');
var exec = require('child_process').exec;
var depsNormalize = require('deps-normalize');

var options = minimist(process.argv.slice(2)),
    trgPath = options.f,
    configPath = options.c || path.join(__dirname, 'config.json'),
    prompt = options.p ? options.p.toString().split(/\s/) : '',
    bemInfo = require('./bem-info.js'),
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8')),
    ownConfig = options.c;

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
        create: startCreating.bind(this, prompt)
    };

var task = options.t || 'auto';
tasks[task]();

function startCreating(fileTypes){
    fileTypes.forEach(function(fileType){
        createFileFromTemplate(fileType);
    });
}

function createFileFromTemplate(fileType, trg, modVal){
    trg = trg || trgPath;

    var tmpPath = FILE_TEMPLATES[fileType];

    if (!ownConfig) {
        tmpPath = path.join(__dirname, tmpPath);
    }

    var file = insertName(getTemplate(tmpPath), trg, modVal);
    var cursorPos = getCursorPosition(file);
    file = file.replace('{{cursor}}', '');

    createFile(file, fileType, trg, modVal, cursorPos);
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
        if (BEM_INFO.isElem) return;

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
        }

        fileTypes.forEach(function(type){
            createFileFromTemplate(type, nodePath, modVal);
        });
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

function createFile(file, type, trg, modVal, cursorPos){
    trg = trg || trgPath;
    modVal = modVal || '';

    var info = bemInfo(trg);
    if (info.isFile) trg = path.dirname(trg);

    var p = path.join(trg, info.bemName + modVal + SUFFIXES[type]);

    if (!fs.existsSync(p)) fs.writeFileSync(p, file);

    if (options.g) gitAddTrg(trg, p);

    if (options.o) {
        var editorCmd = config['editor-open-command']
            .replace('{{file-path}}', p)
            .replace('{{line-number}}', cursorPos);

        exec(editorCmd, function (error, stdout, stderr) {
            if (error) console.error(error);
            if (stderr) console.error(stderr);
        });
    }
}

function getTemplate(tmpPath){
    return fs.readFileSync(tmpPath, 'utf-8');
}

function gitAddTrg(dir, file){
    exec('cd ' + dir + ' && git add ' + file, function (error, stdout, stderr) {
        if (stderr) console.error(stderr);
    });
}

function getCursorPosition(file){
    var cursorPos = 1;
    file.split('\n').forEach(function(line, i){
        if (/{{cursor}}/.test(line)) {
            cursorPos = i + 1;
        }
    });

    return cursorPos;
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
