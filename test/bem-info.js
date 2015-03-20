/* global describe, it */

'use strict';

require('should');

var bemInfo = require('../bem-info.js');

describe('bemInfo', function () {
    it('should be correct processing with "/" in the end of block path', function () {
        bemInfo({
            trgPath: 'somePath/someBlock/',
            isFile: false
        }).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'blockDir',
            dirName: 'someBlock',
            dirPath: 'somePath/someBlock/',
            nodeType: 'block',
            fileName: '',
            ownInfo: { blockName: 'someBlock', elemName: '', modName: '' },
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
        bemInfo({
            trgPath: 'somePath/someBlock/',
            isFile: false
        }).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'blockDir',
            fileName: '',
            nodeType: 'block',
            ownInfo: { blockName: 'someBlock', elemName: '', modName: '' },
            dirName: 'someBlock',
            dirPath: 'somePath/someBlock/',
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
        bemInfo({
            trgPath: 'somePath/someBlock/__someElem/',
            isFile: false
        }).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'elemDir',
            dirName: '__someElem',
            fileName: '',
            nodeType: 'elem',
            ownInfo: { blockName: 'someBlock', elemName: '__someElem', modName: '' },
            dirPath: 'somePath/someBlock/__someElem/',
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
        bemInfo({
            trgPath: 'somePath/someBlock/__someElem',
            isFile: false
        }).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'elemDir',
            dirPath: 'somePath/someBlock/__someElem',
            fileName: '',
            dirName: '__someElem',
            nodeType: 'elem',
            ownInfo: { blockName: 'someBlock', elemName: '__someElem', modName: '' },
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
        bemInfo({
            trgPath: 'somePath/someBlock/__someElem/_someMod/',
            isFile: false
        }).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'modDir',
            dirPath: 'somePath/someBlock/__someElem/_someMod/',
            dirName: '_someMod',
            isBlock: false,
            isElem: false,
            isMod: true,
            fileName: '',
            nodeType: 'mod',
            ownInfo: {
                blockName: 'someBlock',
                elemName: '__someElem',
                modName: '_someMod'
            },
            blockName: 'someBlock',
            elemName: '__someElem',
            modName: '_someMod',
            bemName: 'someBlock__someElem_someMod' }
        );
    });

    it('should be correct processing without "/" in the end of mod path', function () {
        bemInfo({
            trgPath: 'somePath/someBlock/__someElem/_someMod',
            isFile: false
        }).should.be.eql({
            isFile: false,
            isDir: true,
            type: 'modDir',
            dirName: '_someMod',
            dirPath: 'somePath/someBlock/__someElem/_someMod',
            nodeType: 'mod',
            ownInfo: {
                blockName: 'someBlock',
                elemName: '__someElem',
                modName: '_someMod'
            },
            fileName: '',
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
        bemInfo({
            trgPath: 'somePath/someBlock/someBlock.deps.js',
            isFile: true
        }).should.be.eql({
            isFile: true,
            isDir: false,
            type: 'deps',
            dirPath: 'somePath/someBlock',
            dirName: 'someBlock',
            isBlock: true,
            isElem: false,
            isMod: false,
            fileName: 'someBlock.deps.js',
            nodeType: 'block',
            ownInfo: { blockName: 'someBlock', elemName: '', modName: '' },
            blockName: 'someBlock',
            elemName: '',
            modName: '',
            bemName: 'someBlock' }
        );
    });

    it('correct detection for elem deps file', function () {
        bemInfo({
            trgPath: 'somePath/someBlock/__someElem/someBlock__someElem.deps.js',
            isFile: true
        }).should.be.eql({
            isFile: true,
            isDir: false,
            type: 'deps',
            dirName: '__someElem',
            dirPath: 'somePath/someBlock/__someElem',
            isBlock: false,
            isElem: true,
            isMod: false,
            fileName: 'someBlock__someElem.deps.js',
            nodeType: 'elem',
            ownInfo: {
                blockName: 'someBlock',
                elemName: '__someElem',
                modName: undefined
            },
            blockName: 'someBlock',
            elemName: '__someElem',
            modName: '',
            bemName: 'someBlock__someElem' }
        );
    });
});
