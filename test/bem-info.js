/* global describe, it */

'use strict';

require('should');

var bemInfo = require('../bem-info.js');

describe('bemInfo', function () {
    it('should be correct processing with "/" in the end of block path', function () {
        bemInfo('somePath/someBlock/', false).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'blockDir',
            dirName: 'someBlock',
            isBlock: true,
            isElem: false,
            isMod: false,
            blockName: 'someBlock',
            elemName: '',
            modName: '',
            bemName: 'someBlock' }
        );
    });

    it('should be correct processing without "/" in the end of block path', function () {
        bemInfo('somePath/someBlock/', false).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'blockDir',
            dirName: 'someBlock',
            isBlock: true,
            isElem: false,
            isMod: false,
            blockName: 'someBlock',
            elemName: '',
            modName: '',
            bemName: 'someBlock' }
        );
    });

    it('should be correct processing with "/" in the end of elem path', function () {
        bemInfo('somePath/someBlock/__someElem/', false).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'elemDir',
            dirName: '__someElem',
            isBlock: false,
            isElem: true,
            isMod: false,
            blockName: 'someBlock',
            elemName: '__someElem',
            modName: '',
            bemName: 'someBlock__someElem' }
        );
    });

    it('should be correct processing without "/" in the end of elem path', function () {
        bemInfo('somePath/someBlock/__someElem', false).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'elemDir',
            dirName: '__someElem',
            isBlock: false,
            isElem: true,
            isMod: false,
            blockName: 'someBlock',
            elemName: '__someElem',
            modName: '',
            bemName: 'someBlock__someElem' }
        );
    });

    it('should be correct processing with "/" in the end of mod path', function () {
        bemInfo('somePath/someBlock/__someElem/_someMod/', false).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'modDir',
            dirName: '_someMod',
            isBlock: false,
            isElem: false,
            isMod: true,
            blockName: 'someBlock',
            elemName: '__someElem',
            modName: '_someMod',
            bemName: 'someBlock__someElem_someMod' }
        );
    });

    it('should be correct processing without "/" in the end of mod path', function () {
        bemInfo('somePath/someBlock/__someElem/_someMod', false).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'modDir',
            dirName: '_someMod',
            isBlock: false,
            isElem: false,
            isMod: true,
            blockName: 'someBlock',
            elemName: '__someElem',
            modName: '_someMod',
            bemName: 'someBlock__someElem_someMod' }
        );
    });

    it('correct detection for block deps file', function () {
        bemInfo('somePath/someBlock/someBlock.deps.js', true).should.be.eql({
            isFile: true,
            isDir: false,
            type: 'deps',
            dirName: 'someBlock',
            isBlock: true,
            isElem: false,
            isMod: false,
            blockName: 'someBlock',
            elemName: '',
            modName: '',
            bemName: 'someBlock' }
        );
    });

    it('correct detection for elem deps file', function () {
        bemInfo('somePath/someBlock/__someElem/someBlock__someElem.deps.js', true).should.be.eql({
            isFile: true,
            isDir: false,
            type: 'deps',
            dirName: '__someElem',
            isBlock: false,
            isElem: true,
            isMod: false,
            blockName: 'someBlock',
            elemName: '__someElem',
            modName: '',
            bemName: 'someBlock__someElem' }
        );
    });
});
