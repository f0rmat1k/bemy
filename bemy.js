#!/usr/bin/env node
'use strict';

var fs = require('fs');
var fse = require('fs-extra');
var minimist = require('minimist');
var path = require('path');
var execSync = require('child_process').execSync;
var depsNormalize = require('deps-normalize');
var kebabCase = require('kebab-case');

var options = minimist(process.argv.slice(2)),
    trgPath = options.f ? path.resolve(options.f) : process.env.PWD,
    prompt = options.p ? options.p.toString().split(/\s/) : options._,
    ownConfig = options.c,
    isDebug = options.debug;

if (!trgPath) {
    console.error('Target path is unknown');
    return;
}

var isWindows = !!process.platform.match(/^win/),
    root = isWindows ? escapeRegExp(trgPath).slice(0, 3) : '/',
    config = getConfig(ownConfig);

if (!config) return;

if (config.checkForUpdate === true) {
    var updateNotifier = require('update-notifier');
    var pkg = require('./package.json');

    updateNotifier({ pkg: pkg }).notify();
}

if (config.debug) isDebug = true;

var bemInfo = require('./bem-info.js')(config),
    bem = config.bem,
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
        rename: function(){
            rename(trgPath);
            gitAdd(gitQueue);
        }
    };

var gitQueue = [];

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

            if (isDebug) console.log('Renamed:\n' + newChildPath + '\n to \n' + currentChildPath);
        } else {
            rename(newChildPath, originNode);
        }
    });

    if (options.g) gitQueue.push(newDirPath)
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
        if (config.auto_dir && !Array.isArray(config.auto_dir)) {
            config.auto_dir = [config.auto_dir];
        }

        fileTypes = config.auto_dir || ['css'];
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

    gitAdd(gitQueue);
}

function createFileFromTemplate(fileType, trg, modVal){
    trg = trg || trgPath;

    var tmpPath,
        hook;

    try {
        tmpPath = SHORTCUTS[fileType].template;

        if (Array.isArray(tmpPath)) {
            hook = tmpPath[1];
            tmpPath = tmpPath[0];
        }
    } catch (e) {
        tmpPath = 'stub/empty.tmp';
    }

    if (!ownConfig) {
        tmpPath = path.join(path.dirname(config.configPath), tmpPath);
    }

    tmpPath = path.resolve(tmpPath);

    var file = insertName(getTemplate(tmpPath), trg, modVal);
    var cursorPos = getCursorPosition(file);
    file = file.replace('{{cursor}}', '');

    createFile(file, fileType, trg, modVal, cursorPos, hook);
}

function insertName(file, trg, modVal){
    var info = bemInfo(trg);

    return file
        .replace(/{{blockName}}/g, lowerCaseFirstLetter(info.blockName))
        .replace(/{{BlockName}}/g, capitalizeFirstLetter(info.blockName))
        .replace(/{{block-name}}/g, kebabCase(lowerCaseFirstLetter(info.blockName)))
        .replace(/{{Block-name}}/g, capitalizeFirstLetter(kebabCase(lowerCaseFirstLetter(info.blockName))))
        .replace(/{{elemName}}/g, info.elemName)
        .replace(/{{ElemName}}/g, capitalizeFirstLetter(info.elemName))
        .replace(/{{elem-name}}/g, kebabCase(lowerCaseFirstLetter(info.elemName)))
        .replace(/{{modName}}/g, info.modName)
        .replace(/{{ModName}}/g, capitalizeFirstLetter(info.modName))
        .replace(/{{mod-name}}/g, kebabCase(lowerCaseFirstLetter(info.modName)))
        .replace(/{{modVal}}/g, modVal || '')
        .replace(/{{ModVal}}/g, capitalizeFirstLetter(modVal))
        .replace(/{{mod-val}}/g, kebabCase(lowerCaseFirstLetter(modVal)));
}

function createStructureByDeps(){
    if (!fs.existsSync(trgPath)) throw new Error('.deps file not found in: ' + trgPath);

    var file = fs.readFileSync(trgPath, 'utf-8'),
        depsObj = depsToObj(file),
        structureList = getNormalaizedDeps(depsObj);

    structureList.forEach(createNode);

    gitAdd(gitQueue);
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
    var mustDeps, shouldDeps;

    if (Array.isArray(data)) {
        data.forEach(function(obj){
            if (obj.mustDeps) mustDeps = obj.mustDeps;
            if (obj.shouldDeps) shouldDeps = obj.shouldDeps;
        });
    } else {
        mustDeps = data.mustDeps;
        shouldDeps = data.shouldDeps;
    }

    var normalizedMustDeps = depsNormalize(mustDeps, { parseString: parseString }),
        normalizedShouldDeps = depsNormalize(shouldDeps, { parseString: parseString });

    return normalizedMustDeps.concat(normalizedShouldDeps);
}

function createFile(file, type, trg, modVal, cursorPos, hook){
    trg = trg || trgPath;

    modVal = modVal || '';

    var info = bemInfo(trg);

    if (info.isFile) trg = path.dirname(trg);

    var filename = SHORTCUTS[type].filename || info.bemName + modVal + SHORTCUTS[type].suffix;

    var p = path.join(trg, filename);

    if (!fs.existsSync(p)) {
        fse.outputFileSync(p, file);

        if (hook) {
            hook = hook.replace('{{filePath}}', p);

            try {
                var hookStdout = execSync(hook).toString('utf-8');

                if (hookStdout) {
                    console.log('Hook output:');
                    console.log(hookStdout);
                }
            } catch(e) {
                console.error("Created. But hook had error.");
                console.error(e);
            }
        }

        if (options.g) gitQueue.push(p);

        if (isDebug) console.log('\nCreated:\n' + p);
    } else {
        console.log('\nAlready exists:\n' + p);
    }

    if (options.o) {
        var editorCmd = config['editor-open-command']
            .replace('{{file-path}}', p)
            .replace('{{line-number}}', cursorPos);

        try {
            var stdout = execSync(editorCmd).toString('utf-8');

            if (stdout) {
                console.log('Editor\'s stdout:');
                console.log(stdout);
            }

        } catch(e) {
            console.log(e);
        }
    }
}

function getTemplate(tmpPath){
    if (!fs.existsSync(tmpPath)) throw new Error('Template not found in: ' + tmpPath);

    return fs.readFileSync(tmpPath, 'utf-8');
}

function gitAdd(files){
    if (files.length === 0) return;

    var fileList = files.join(' ');

    var dir = path.dirname(files[0]);

    var stdout = execSync('cd ' + dir + ' && git add ' + fileList).toString('utf-8');

    if (stdout) console.error(stdout);

    if (isDebug) {
        console.log('Added to git: \n' + files.join('\n'));
    }
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

function getConfig(ownConfig){
    if (ownConfig === true) {
        console.error('Error. Path after -c is not specified.');
        return;
    }

    var configPath;

    if (ownConfig) {
        configPath = path.resolve(ownConfig);
    } else {
        configPath = getConfigPath(path.dirname(trgPath)) || path.join(__dirname, '.bemy.json');
    }

    if (isDebug) console.log('Config path: ' + configPath);

    try {
        var config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        config.configPath = configPath;
    } catch(e) {
        throw new Error('Problems with config:\n' + e);
    }

    return config;
}

function getConfigPath(dir) {
    if (dir === root) {
        if (isWindows) {
            var homeFilePath = path.resolve(path.resolve(process.env.USERPROFILE), '.bemy.json');

            if (fs.existsSync(homeFilePath)) {
                return homeFilePath;
            }
            return;
        } else return;
    }

    var checkPath = path.resolve(dir, '.bemy.json');
    if (fs.existsSync(checkPath)) {
        return checkPath;
    } else {
        return getConfigPath(path.resolve(dir, '../'));
    }
}

function capitalizeFirstLetter(string) {
	string = string || '';
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function lowerCaseFirstLetter(string) {
    string = string || '';
    return string.charAt(0).toLowerCase() + string.slice(1);
}
