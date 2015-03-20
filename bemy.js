#!/usr/bin/env node

'use strict';

var fs = require('fs');
var minimist = require('minimist');
var path = require('path');
var exec = require('child_process').exec;
var depsNormalize = require('deps-normalize');

var options = minimist(process.argv.slice(2)),
    trgPath = options.f,
    configPath = options.c ? path.resolve(options.c) : path.join(__dirname, 'config.json'),
    prompt = options.p ? options.p.toString().split(/\s/) : '',
    bemInfo = require('./bem-info.js'),
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8')),
    ownConfig = options.c;

var bem = config.bem,
    BEM_INFO = bemInfo({
        trgPath: trgPath,
        bem: bem
    }),
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
        rename: rename.bind(this, trgPath)
    },
    FILE_TYPES = [],
    EXTENSIONS = function(){
        var result = {};

        Object.keys(SUFFIXES).forEach(function(shortcut){
            FILE_TYPES.push(SUFFIXES[shortcut]);

            var shortcuts = shortcut.split(/\s/ig);
            if (shortcuts.length > 1) {
                shortcuts.forEach(function(current_shortcut){
                    result[current_shortcut] = SUFFIXES[shortcut];
                });
            } else {
                result[shortcut] = SUFFIXES[shortcut];
            }
        });

        return result;
    }();

var task = options.t || 'auto';
tasks[task]();

function rename(nodePath, originNode){
    var nodeInfo = bemInfo({ trgPath: nodePath });

    if (nodeInfo.isFile && !originNode) {
        rename(path.dirname(nodePath));
        return;
    }

    originNode = originNode || {
        originalInfo: bemInfo({ trgPath: nodePath }),
        path: nodePath,
        type: nodeInfo.nodeType,
        newName: prompt[0],
        name: nodeInfo[nodeInfo.nodeType + 'Name']
            .replace(bem.separators.elem, '')
            .replace(bem.separators.mod, '')
            .replace(bem.separators.modVal, '')
    };

    var dirName = path.basename(nodePath),
        nodeParent = path.resolve(nodePath, '../'),
        newDirName = dirName.replace(originNode.name, originNode.newName),
        newDirPath = path.resolve(nodeParent, newDirName);

    fs.renameSync(nodePath, newDirPath);

    if (options.g) gitAddTrg(nodeParent, newDirPath);

    var nodes = getValidDirNodes(nodePath, newDirPath, originNode.originalInfo);

    nodes.forEach(function(node){
        var oldChildPath = path.resolve(nodePath, node),
            currentChildPath = path.resolve(newDirPath, node),
            childInfo = bemInfo({
                trgPath: oldChildPath,
                isFile: bemInfo({ trgPath: currentChildPath }).isFile
            }),
            newChildPath = path.resolve(newDirPath, node.replace(originNode.name, originNode.newName));

        if (childInfo.isFile) {
            fs.renameSync(currentChildPath, newChildPath);

            if (options.g) gitAddTrg(nodeParent, newChildPath);
        } else {
            rename(newChildPath, originNode);
        }
    });
}

function getValidDirNodes(oldNodePath, newNodePath, originalInfo){
    return fs.readdirSync(newNodePath).filter(function(child){
        return isValidNode(child, oldNodePath, newNodePath, originalInfo);
    });
}

function isValidNode(child, oldParentPath, newParentPath, originalInfo){
    var parentInfo = bemInfo({ trgPath: oldParentPath }),
        childPath = path.resolve(oldParentPath, child),
        newChildPath = path.resolve(newParentPath, child),
        isValid;

        var childInfo = bemInfo({
            trgPath: childPath,
            isFile: bemInfo({ trgPath: newChildPath }).isFile
        });

    if (childInfo.isFile) {
        if (!childInfo.type) {
            isValid = false;
        } else {
            FILE_TYPES.forEach(function(fileType){
                if (child.indexOf(fileType) !== -1) {
                    if (childInfo.ownInfo.blockName !== originalInfo.blockName) {
                        isValid = false;
                    } else if (parentInfo.isElem && childInfo.ownInfo.elemName !== parentInfo.elemName) {
                        isValid = false;
                    } else if (parentInfo.isMod && childInfo.ownInfo.modName !== parentInfo.modName) {
                        isValid = false;
                    } else {
                        isValid = true;
                    }
                }
            });
        }
    } else {
        switch (parentInfo.nodeType) {
            case 'block': isValid = childInfo.isElem || childInfo.isMod; break;
            case 'elem': isValid = childInfo.isMod; break;

            default: isValid = false;
        }
    }

    return isValid;
}

function startCreating(fileTypes){
    fileTypes.forEach(function(fileType){
        createFileFromTemplate(fileType);
    });
}

function createFileFromTemplate(fileType, trg, modVal){
    trg = trg || trgPath;

    var tmpPath = FILE_TEMPLATES[fileType];

    if (!tmpPath) {
        console.error('Unknown file type');
        return;
    }

    if (!ownConfig) {
        tmpPath = path.join(__dirname, tmpPath);
    }

    tmpPath = path.resolve(tmpPath);

    var file = insertName(getTemplate(tmpPath), trg, modVal);
    var cursorPos = getCursorPosition(file);
    file = file.replace('{{cursor}}', '');

    createFile(file, fileType, trg, modVal, cursorPos);
}

function insertName(file, trg, modVal){
    var info = bemInfo({
        trgPath: trg,
        bem: bem
    });

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
        modSeparator = bem.separators.mod || '_',
        modValSeparator = bem.separators.modVal || '_',
        modVal = nodeObj.modVal ? modValSeparator + nodeObj.modVal : '';

    if (nodeObj.elem) {
        if (BEM_INFO.isElem) return;

        var elemSeparator = bem.separators.elem || '__';

        nodePath = path.join(blockDir, elemSeparator + nodeObj.elem);

        if (!fs.existsSync(nodePath)) {
            fs.mkdirSync(nodePath);

            fileTypes.forEach(function(type){
                createFileFromTemplate(type, nodePath);
            });
        }

        if (nodeObj.modName) {
            nodePath = path.join(nodePath, modSeparator + nodeObj.modName);

            if (!fs.existsSync(nodePath)) {
                fs.mkdirSync(nodePath);
            }

            fileTypes.forEach(function(type){
                createFileFromTemplate(type, nodePath, modVal);
            });
        }
    } else {
        nodePath = path.join(blockDir, modSeparator + nodeObj.modName);
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

    var info = bemInfo({
        trgPath: trg,
        bem: bem
    });

    if (info.isFile) trg = path.dirname(trg);

    var p = path.join(trg, info.bemName + modVal + EXTENSIONS[type]);

    if (!fs.existsSync(p)) {
        fs.writeFileSync(p, file);

        if (options.g) gitAddTrg(trg, p);

        if (options.o) {
            var editorCmd = config['editor-open-command']
                .replace('{{file-path}}', p)
                .replace('{{line-number}}', cursorPos);

            exec(editorCmd, function (error, stdout, stderr) {
                if (stderr) console.error(stderr);
            });
        }
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
    var obj = {},
        allowedSymbols = bem['allowed-name-symbols-regexp'],
        blockRegExp = new RegExp(allowedSymbols + '+', 'i'),
        elemSeparator = bem && bem.separators.elem || '__',
        modSeparator = bem && bem.separators.mod || '_',
        modValSeparator = bem && bem.separators.modVal || '_';

    var block = (dep.match(blockRegExp) || [])[0],
        elem = (dep.match(new RegExp('^' + allowedSymbols + '+' + elemSeparator + '(' + allowedSymbols + '+)', 'i')) || [])[1],
        modName = (dep.match(new RegExp('[^' + modSeparator + ']' + modSeparator + '(' + allowedSymbols + '+)', 'i')) || [])[1],
        modVal = (dep.match(new RegExp('[^' + modSeparator + ']' + modSeparator + allowedSymbols + '+' + modValSeparator + '(' + allowedSymbols + '+)', 'i')) || [])[1];

    block && (obj['block'] = block);
    elem && (obj['elem'] = elem);
    modName && (obj['modName'] = modName);
    modVal && (obj['modVal'] = modVal);

    return obj;
}
