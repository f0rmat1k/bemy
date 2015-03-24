#!/usr/bin/env node

'use strict';

var fs = require('fs');
var minimist = require('minimist');
var path = require('path');
var exec = require('child_process').exec;
var depsNormalize = require('deps-normalize');

var options = minimist(process.argv.slice(2)),
    trgPath = options.f ? path.resolve(options.f) : process.env.PWD,
    configPath = options.c ? path.resolve(options.c) : path.join(__dirname, 'config.json'),
    prompt = options.p ? options.p.toString().split(/\s/) : options._,
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8')),
    isOwnConfig = options.c,
    bemInfo = require('./bem-info.js')(config);

var bem = config.bem,
    SHORTCUTS = function(){
        var fileTypes = config['file-types'],
            shortcuts = {};

        Object.keys(fileTypes).forEach(function(fileType){
            try {
                var cuts = fileTypes[fileType].shortcuts;
                if (!Array.isArray(cuts)) cuts = [ cuts ];

                cuts.forEach(function(cut){
                    shortcuts[cut] = fileTypes[fileType];
                });
            } catch (e) {}
        });

        return shortcuts;
    }(),
    DEFAULT_ACTIONS = {
        blockDir: startCreating.bind(this, prompt),
        deps: createStructureByDeps,
        elemDir: startCreating.bind(this, prompt),
        modDir: startCreating.bind(this, prompt)
    },
    BEM_INFO = bemInfo(trgPath),
    tasks = {
        auto: function(){
            var defaultAction = DEFAULT_ACTIONS[BEM_INFO.type];
            if (defaultAction) {
                defaultAction();
            } else {
                console.error("You can't run autotask on unsupported files (Currently supports only *.deps.js)");
            }
        },
        create: startCreating.bind(this, prompt),
        rename: rename.bind(this, trgPath)
    };

var task = options.t || (prompt.length > 0 ? 'create' : 'auto');

tasks[task]();

function rename(nodePath, originNode){
    var nodeInfo = bemInfo(nodePath);

    if (nodeInfo.isFile && !originNode) {
        rename(path.dirname(nodePath));
        return;
    }

    originNode = originNode || {
        originalInfo: bemInfo(nodePath),
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

    var nodes = getValidDirNodes(nodePath, newDirPath, originNode.originalInfo);

    nodes.forEach(function(node){
        var oldChildPath = path.resolve(nodePath, node),
            currentChildPath = path.resolve(newDirPath, node),
            childInfo = bemInfo(oldChildPath, bemInfo(currentChildPath).isFile),
            newChildPath = path.resolve(newDirPath, node.replace(originNode.name, originNode.newName));

        if (childInfo.isFile) {
            fs.renameSync(currentChildPath, newChildPath);
            if (options.d) {
                var file = fs.readFileSync(newChildPath, 'utf-8'),
                    newFileInfo = bemInfo(newChildPath),
                    newName = newFileInfo.bemName,
                    oldName = newName.replace(prompt[0], originNode.name),
                    renameRule = config['file-types'][newFileInfo.type].rename,
                    oldString = oldName,
                    newString = newName;

                if (renameRule) {
                    if (!Array.isArray(renameRule)) {
                        renameRule = [renameRule];
                    }

                    renameRule.forEach(function(rule){
                        oldString = escapeRegExp(rule.replace(/{{bemNode}}/g, oldName));
                        newString = rule.replace(/{{bemNode}}/g, newName);

                        file = file.replace(new RegExp(oldString, 'g'), newString);
                    });
                }

                fs.writeFileSync(newChildPath, file);
            }

            if (config.logging === true) console.log('Renamed:\n' + newChildPath + '\n to \n' + currentChildPath);
        } else {
            rename(newChildPath, originNode);
        }
    });

    if (options.g) gitAddTrg(nodeParent, newDirPath);
}

function getValidDirNodes(oldNodePath, newNodePath, originalInfo){
    return fs.readdirSync(newNodePath).filter(function(child){
        return isValidNode(child, oldNodePath, newNodePath, originalInfo);
    });
}

function isValidNode(child, oldParentPath, newParentPath, originalInfo){
    var parentInfo = bemInfo(oldParentPath),
        childPath = path.resolve(oldParentPath, child),
        newChildPath = path.resolve(newParentPath, child),
        isValid;

        var childInfo = bemInfo(childPath, bemInfo(newChildPath).isFile);

    if (childInfo.isFile) {
        if (!childInfo.type) {
            isValid = false;
        } else {
            var fileTypes = config['file-types'];
            Object.keys(fileTypes).forEach(function(fileType){
                var suffix = fileTypes[fileType].suffix;

                if (child.indexOf(suffix) !== -1) {
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

function normalizeFileTypes(fileTypes){
    return fileTypes.filter(function(fileType){
        if (!!SHORTCUTS[fileType]) return true;
        console.log('Invalid file type: ' + fileType + '. ');
        return false;
    });
}

function startCreating(fileTypes){
    if (!fileTypes || fileTypes.length === 0) {
        fileTypes = ['css']
    } else {
        fileTypes = normalizeFileTypes(fileTypes);
    }

    if (fileTypes.length === 0) {
        console.log('Nothing to create');
        return;
    }

    fileTypes.forEach(function(fileType){
        createFileFromTemplate(fileType);
    });
}

function createFileFromTemplate(fileType, trg, modVal){
    trg = trg || trgPath;

    var tmpPath;
    try { tmpPath = SHORTCUTS[fileType].template; } catch (e) {
        tmpPath = 'tmp/empty.tmp'
    }

    //todo resolve
    if (!isOwnConfig) {
        tmpPath = path.join(__dirname, tmpPath);
    }

    tmpPath = path.resolve(tmpPath);

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
        modSeparator = bem.separators.mod,
        modValSeparator = bem.separators.modVal,
        modVal = nodeObj.modVal ? modValSeparator + nodeObj.modVal : '';

    if (nodeObj.elem) {
        if (BEM_INFO.isElem) return;

        var elemSeparator = bem.separators.elem;

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

    var info = bemInfo(trg);

    if (info.isFile) trg = path.dirname(trg);

    var p = path.join(trg, info.bemName + modVal + SHORTCUTS[type].suffix);

    if (!fs.existsSync(p)) {
        fs.writeFileSync(p, file);

        if (config.logging === true) console.log('\nCreated:\n' + p);

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
        elemSeparator = bem.separators.elem,
        modSeparator = bem.separators.mod,
        modValSeparator = bem.separators.modVal;

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

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
