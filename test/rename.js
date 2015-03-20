/* global describe, it */

require('should');

var sh = require('execSync');
var exec = sh.run;
var fs = require('fs-extra');

createTestBlock();

describe('Renaming', function(){
    it('Renaming mod of block', function(){
        exec('node bemy.js -t rename -f test/rename/_mod -p "foo"');

        fs.existsSync('test/rename/_foo/').should.be.eql(true);
        fs.existsSync('test/rename/_foo/rename_foo.css').should.be.eql(true);
        fs.existsSync('test/rename/_foo/rename_foo_val.js').should.be.eql(true);
    });

    it('Renaming mods of block when called by mod file', function(){
        exec('node bemy.js -t rename -f test/rename/_foo/rename_foo_val.js -p "bar"');

        fs.existsSync('test/rename/_bar/').should.be.eql(true);
        fs.existsSync('test/rename/_bar/rename_bar.css').should.be.eql(true);
        fs.existsSync('test/rename/_bar/rename_bar_val.js').should.be.eql(true);
    });

    it('Renaming elem', function(){
        exec('node bemy.js -t rename -f test/rename/__elem -p "text"');

        fs.existsSync('test/rename/__text/').should.be.eql(true);
        fs.existsSync('test/rename/__text/rename__text.css').should.be.eql(true);
        fs.existsSync('test/rename/__text/rename__text.deps.js').should.be.eql(true);

        fs.existsSync('test/rename/__text/_mod/rename__text_mod.css').should.be.eql(true);
        fs.existsSync('test/rename/__text/_mod/rename__text_mod_val.js').should.be.eql(true);
    });

    it('Renaming elem when called by elem file', function(){
        exec('node bemy.js -t rename -f test/rename/__text/rename__text.deps.js -p "kontur"');

        fs.existsSync('test/rename/__kontur/').should.be.eql(true);
        fs.existsSync('test/rename/__kontur/rename__kontur.css').should.be.eql(true);
        fs.existsSync('test/rename/__kontur/rename__kontur.deps.js').should.be.eql(true);

        fs.existsSync('test/rename/__kontur/_mod/rename__kontur_mod.css').should.be.eql(true);
        fs.existsSync('test/rename/__kontur/_mod/rename__kontur_mod_val.js').should.be.eql(true);
    });

    it('Renaming mod of elem', function(){
        exec('node bemy.js -t rename -f test/rename/__kontur/_mod/ -p "foo"');

        fs.existsSync('test/rename/__kontur/_foo').should.be.eql(true);
        fs.existsSync('test/rename/__kontur/_foo/rename__kontur_foo.css').should.be.eql(true);
        fs.existsSync('test/rename/__kontur/_foo/rename__kontur_foo_val.js').should.be.eql(true);
    });

    it('Renaming mod of elem when called by mod file', function(){
        exec('node bemy.js -t rename -f test/rename/__kontur/_foo/rename__kontur_foo_val.js -p "bar"');

        fs.existsSync('test/rename/__kontur/_bar').should.be.eql(true);
        fs.existsSync('test/rename/__kontur/_bar/rename__kontur_bar.css').should.be.eql(true);
        fs.existsSync('test/rename/__kontur/_bar/rename__kontur_bar_val.js').should.be.eql(true);
    });

    it('Block renaming', function(){
        exec('node bemy.js -t rename -f test/rename -p "megablock"');

        fs.existsSync('test/megablock').should.be.eql(true);
        fs.existsSync('test/megablock/megablock.css').should.be.eql(true);
        fs.existsSync('test/megablock/megablock.priv.js').should.be.eql(true);

        fs.existsSync('test/megablock/_bar/megablock_bar.css').should.be.eql(true);
        fs.existsSync('test/megablock/_bar/megablock_bar_val.js').should.be.eql(true);

        fs.existsSync('test/megablock/__kontur/megablock__kontur.css').should.be.eql(true);
        fs.existsSync('test/megablock/__kontur/megablock__kontur.deps.js').should.be.eql(true);

        fs.existsSync('test/megablock/__kontur/_bar/megablock__kontur_bar.css').should.be.eql(true);
        fs.existsSync('test/megablock/__kontur/_bar/megablock__kontur_bar_val.js').should.be.eql(true);
    });

    it('Block renaming when called by mod', function(){
        exec('node bemy.js -t rename -f test/megablock/megablock.priv.js -p "slider"');

        fs.existsSync('test/slider').should.be.eql(true);
        fs.existsSync('test/slider/slider.css').should.be.eql(true);
        fs.existsSync('test/slider/slider.priv.js').should.be.eql(true);

        fs.existsSync('test/slider/_bar/slider_bar.css').should.be.eql(true);
        fs.existsSync('test/slider/_bar/slider_bar_val.js').should.be.eql(true);

        fs.existsSync('test/slider/__kontur/slider__kontur.css').should.be.eql(true);
        fs.existsSync('test/slider/__kontur/slider__kontur.deps.js').should.be.eql(true);

        fs.existsSync('test/slider/__kontur/_bar/slider__kontur_bar.css').should.be.eql(true);
        fs.existsSync('test/slider/__kontur/_bar/slider__kontur_bar_val.js').should.be.eql(true);
    });

    it('Garbage must be ignored', function(){
        fs.existsSync('test/slider/slider.less').should.be.eql(false);
        fs.existsSync('test/slider/__kontur/__wrong').should.be.eql(true);
        fs.existsSync('test/slider/_bar/_wrong').should.be.eql(true);

        fs.removeSync('test/slider/');
    });
});

function createTestBlock(){
    fs.mkdirpSync('test/rename');
    fs.writeFileSync('test/rename/rename.css');
    fs.writeFileSync('test/rename/rename.priv.js');

    fs.mkdirpSync('test/rename/_mod');
    fs.writeFileSync('test/rename/_mod/rename_mod.css');
    fs.writeFileSync('test/rename/_mod/rename_mod_val.js');

    fs.mkdirpSync('test/rename/__elem');
    fs.writeFileSync('test/rename/__elem/rename__elem.css');
    fs.writeFileSync('test/rename/__elem/rename__elem.deps.js');

    fs.mkdirpSync('test/rename/__elem/_mod');
    fs.writeFileSync('test/rename/__elem/_mod/rename__elem_mod.css');
    fs.writeFileSync('test/rename/__elem/_mod/rename__elem_mod_val.js');

    //garbage
    fs.writeFileSync('test/rename/rename.less');
    fs.mkdirpSync('test/rename/__elem/__wrong');
    fs.mkdirpSync('test/rename/_mod/_wrong');
}
