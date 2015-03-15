/* global describe, it */

require('should');

var sh = require('execSync');
var fs = require('fs-extra');
var path = require('path');

var blockName = 'test-block',
    blockDir = path.join(__dirname, blockName),
    depsTmpPath = path.join('test', 'deps-template.js');

fs.removeSync(blockDir);
fs.removeSync(depsTmpPath);

fs.mkdirSync(blockDir);

//tests
var deps = {

    //elems
    '__car/test-block__car.css': 'test-block__car',
    '__tar/test-block__tar.css': { elem: 'tar' },
    '__foo/test-block__foo.css': { elems: ['foo', 'bar'] },
    '__bar/test-block__bar.css': { elems: ['foo', 'bar'] },
    '__one/test-block__one.css': { elem: 'one', mods: { three: 'four' } },

    //elem mods
    '__sop/test-block__sop.css': 'test-block__sop_gop',
    '__sop/_gop/test-block__sop_gop.css': 'test-block__sop_gop',

    //elem mod values
    '__sop/_gop/test-block__sop_gop_kop.css': 'test-block__sop_gop_kop',
    '__one/_three/test-block__one_three_four.css': { elem: 'one', mods: { three: 'four' } },

    //block mods
    '_dop/test-block_dop.css': 'test-block_dop',
    '_firstMod/test-block_firstMod.css': { mods: ['firstMod', 'secondMod'] },
    '_secondMod/test-block_secondMod.css': { mods: ['firstMod', 'secondMod'] },

    //block mod values
    '_hop/test-block_hop_op.css': 'test-block_hop_op',
    '_jazz/test-block_jazz_fazz.css': { mods: { jazz: 'fazz' } },
    '_lolz/test-block_lolz_foo.css': { mods: { lolz: [ 'foo', 'bar' ] } },
    '_lolz/test-block_lolz_bar.css': { mods: { lolz: [ 'foo', 'bar' ] } }
};

createDepsTpl(deps);

describe('Files creating', function(){
    it ('Create task: should be correct blocks files creating', function(done){
        testCreatingTask();
        testDepsCreationFiles();

        fs.removeSync(blockDir);
        fs.removeSync(depsTmpPath);

        done();
    });
});

function testCreatingTask(){
    createBlockFiles();

    fs.existsSync(path.join('test', blockName, blockName + '.css')).should.be.eql(true);
    fs.existsSync(path.join('test', blockName, blockName + '.js')).should.be.eql(true);
    fs.existsSync(path.join('test', blockName, blockName + '.bh.js')).should.be.eql(true);
    fs.existsSync(path.join('test', blockName, blockName + '.priv.js')).should.be.eql(true);
    fs.existsSync(path.join('test', blockName, blockName + '.deps.js')).should.be.eql(true);
}

function createBlockFiles(){
    sh.run('node bemy.js -t create -p "c d j b p" -c ./test/config.json -f ' + blockDir);
    fs.existsSync(path.resolve(blockDir, blockName + '.css')).should.be.eql(true);
}

function runDepsAutoTask(){
    var blockDepsFilePath = path.resolve(blockDir, blockName + '.deps.js');
    sh.run('node bemy.js -c ./test/config.json -f ' + blockDepsFilePath);
}

function testDepsCreationFiles(){
    runDepsAutoTask();

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
