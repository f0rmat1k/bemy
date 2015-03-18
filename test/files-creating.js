/* global describe, it */

require('should');

var sh = require('execSync');
var fs = require('fs-extra');
var path = require('path');

var blockName = 'testBlock',
    blockDir = path.join(__dirname, blockName),
    depsTmpPath = path.join('test', 'deps-template.js');

//tests
describe('Files creating', function(){
    it ('Create task: should be correct blocks files creating', function(done){
        [
            'config.json',
            'config_custon-separators.json'

        ].forEach(function(configName){
                var configPath = path.resolve('test', configName),
                    config = JSON.parse(fs.readFileSync(configPath, 'utf-8')),
                    separators = config.bem.separators;

                fs.removeSync(blockDir);
                fs.removeSync(depsTmpPath);

                fs.mkdirSync(blockDir);

                var deps = getDeps(separators);
                createDepsTpl(deps);

                testCreatingTask(configPath);
                testDepsCreationFiles(deps, configPath);

                fs.removeSync(blockDir);
                fs.removeSync(depsTmpPath);
            });

        done();
    });
});

function testCreatingTask(configPath){
    createBlockFiles(configPath);

    fs.existsSync(path.join('test', blockName, blockName + '.css')).should.be.eql(true);
    fs.existsSync(path.join('test', blockName, blockName + '.js')).should.be.eql(true);
    fs.existsSync(path.join('test', blockName, blockName + '.bh.js')).should.be.eql(true);
    fs.existsSync(path.join('test', blockName, blockName + '.priv.js')).should.be.eql(true);
    fs.existsSync(path.join('test', blockName, blockName + '.deps.js')).should.be.eql(true);
}

function createBlockFiles(configPath){
    sh.run('node bemy.js -t create -p "c d j b p" -c ' + configPath + ' -f ' + blockDir);
    fs.existsSync(path.resolve(blockDir, blockName + '.css')).should.be.eql(true);
}

function runDepsAutoTask(configPath){
    var blockDepsFilePath = path.resolve(blockDir, blockName + '.deps.js');
    sh.run('node bemy.js -c ' + configPath + ' -f ' + blockDepsFilePath);
}

function testDepsCreationFiles(deps, configPath){
    runDepsAutoTask(configPath);

    Object.keys(deps).forEach(function(key){
        var filePath = path.resolve('test/', blockName, key);
        var isExists = fs.existsSync(filePath);
        if (!isExists) console.error("Path isn't exists: " + filePath);
        (isExists).should.be.eql(true);
    });
}

function createDepsTpl(deps){
    var shouldDeps = Object.keys(deps).map(function(key){
        return deps[key];
    });

    var obj = JSON.stringify(shouldDeps);

    var depsPath = path.resolve('test/', 'deps-template.js');
    var depsFile = '({ shouldDeps: ' + obj  + '})';

    fs.writeFileSync(depsPath, depsFile);
}

function getDeps(separators){

    // {{e-s}} = elem separator
    // {{m-s}} = mod separator
    // {{mv-s}} = mod value separator

    var depsTpl = {
        //elems
        '{{e-s}}car/testBlock{{e-s}}car.css': 'testBlock{{e-s}}car',
        '{{e-s}}tar/testBlock{{e-s}}tar.css': { elem: 'tar' },
        '{{e-s}}foo/testBlock{{e-s}}foo.css': { elems: ['foo', 'bar'] },
        '{{e-s}}bar/testBlock{{e-s}}bar.css': { elems: ['foo', 'bar'] },
        '{{e-s}}one/testBlock{{e-s}}one.css': { elem: 'one', mods: { three: 'four' } },

        //elem mods
        '{{e-s}}sop/testBlock{{e-s}}sop.css': 'testBlock{{e-s}}sop{{m-s}}gop',
        '{{e-s}}sop/{{m-s}}gop/testBlock{{e-s}}sop{{m-s}}gop.css': 'testBlock{{e-s}}sop{{m-s}}gop',

        //elem mod values
        '{{e-s}}sop/{{m-s}}gop/testBlock{{e-s}}sop{{m-s}}gop{{mv-s}}kop.css': 'testBlock{{e-s}}sop{{m-s}}gop{{mv-s}}kop',
        '{{e-s}}one/{{m-s}}three/testBlock{{e-s}}one{{m-s}}three{{mv-s}}four.css': { elem: 'one', mods: { three: 'four' } },

        //block mods
        '{{m-s}}dop/testBlock{{m-s}}dop.css': 'testBlock{{m-s}}dop',
        '{{m-s}}firstMod/testBlock{{m-s}}firstMod.css': { mods: ['firstMod', 'secondMod'] },
        '{{m-s}}secondMod/testBlock{{m-s}}secondMod.css': { mods: ['firstMod', 'secondMod'] },

        //block mod values
        '{{m-s}}hop/testBlock{{m-s}}hop{{mv-s}}op.css': 'testBlock{{m-s}}hop{{mv-s}}op',
        '{{m-s}}jazz/testBlock{{m-s}}jazz{{mv-s}}fazz.css': { mods: { jazz: 'fazz' } },
        '{{m-s}}lolz/testBlock{{m-s}}lolz{{mv-s}}foo.css': { mods: { lolz: [ 'foo', 'bar' ] } },
        '{{m-s}}lolz/testBlock{{m-s}}lolz{{mv-s}}bar.css': { mods: { lolz: [ 'foo', 'bar' ] } }
    };

    var resultDeps = {};
    Object.keys(depsTpl).forEach(function(key){
        var val = depsTpl[key];

        key = key
            .replace(/\{\{e\-s\}\}/g, separators.elem)
            .replace(/\{\{m\-s\}\}/g, separators.mod)
            .replace(/\{\{mv\-s\}\}/g, separators.modVal);

        if (typeof val === 'string') {
            val = val
                .replace(/\{\{e\-s\}\}/g, separators.elem)
                .replace(/\{\{m\-s\}\}/g, separators.mod)
                .replace(/\{\{mv\-s\}\}/g, separators.modVal);
        }

        resultDeps[key] = val;
    });

    return resultDeps;
}
