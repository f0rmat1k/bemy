/* global describe, it */

require('should');

var execSync = require('child_process').execSync;
var fs = require('fs-extra');
var path = require('path');

describe('Hooks', function(){
    before(function(){
        fs.mkdirpSync('test/hook-block');
    });

    after(function(){
        fs.removeSync('test/hook-block/');
    });

    it('Replacing file content', function(){
        var configPath = path.resolve('test', 'config-hooks.json');
        console.log('node bemy.js -t create -f test/hook-block -p "j" -c ' + configPath);

        execSync('node bemy.js -t create -f test/hook-block -p "j" -c ' + configPath).toString('utf-8');

        fs.readFileSync('test/hook-block/hook-block.js', 'utf-8').should.be.eql('test-content');
    });
});
