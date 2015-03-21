/* global describe, it */

require('should');

var sh = require('execSync');
var exec = sh.run;
var fs = require('fs-extra');

describe('Renaming', function(){
    describe('#Simple renaming', function(){
        before(createTestBlock);

        after(function(){
            fs.removeSync('test/slider/');
        });

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
        });
    });

    describe('#Deep renaming', function(){
        before(createTestBlock);

        after(function(){
            fs.removeSync('test/megablock/');
        });

        it('Correct renaming of mod of block', function(){
            exec('node bemy.js -t rename -f test/rename/_mod -p "foo" -d');
            fs.readFileSync('test/rename/_foo/rename_foo.css', 'utf-8').indexOf('.rename_foo').should.not.eql(-1);
            fs.readFileSync('test/rename/_foo/rename_foo_val.js', 'utf-8').indexOf('rename_foo_val').should.not.eql(-1);
        });

        it('Correct renaming of elem', function(){
            exec('node bemy.js -t rename -f test/rename/__elem -p "some" -d');
            fs.readFileSync('test/rename/__some/rename__some.css', 'utf-8').indexOf('.rename__some').should.not.eql(-1);
            fs.readFileSync('test/rename/__some/rename__some.deps.js', 'utf-8').indexOf('rename__some').should.be.eql(-1);
        });

        it('Correct renaming of mod of elem', function(){
            exec('node bemy.js -t rename -f test/rename/__some/_mod -p "foo" -d');
            fs.readFileSync('test/rename/__some/_foo/rename__some_foo.css', 'utf-8').indexOf('.rename__some_foo').should.not.eql(-1);
            fs.readFileSync('test/rename/__some/_foo/rename__some_foo_val.js', 'utf-8').indexOf('rename__some_foo_val').should.not.eql(-1);
        });

        it('Correct renaming of block', function(){
            exec('node bemy.js -t rename -f test/rename -p "megablock" -d');

            fs.readFileSync('test/megablock/megablock.css', 'utf-8').indexOf('.megablock').should.not.eql(-1);
            fs.readFileSync('test/megablock/megablock.priv.js', 'utf-8').indexOf('megablock').should.not.eql(-1);

            fs.readFileSync('test/megablock/_foo/megablock_foo.css', 'utf-8').indexOf('.megablock_foo').should.not.eql(-1);
            fs.readFileSync('test/megablock/_foo/megablock_foo_val.js', 'utf-8').indexOf('megablock_foo_val').should.not.eql(-1);

            fs.readFileSync('test/megablock/__some/megablock__some.css', 'utf-8').indexOf('.megablock__some').should.not.eql(-1);
            fs.readFileSync('test/megablock/__some/megablock__some.deps.js', 'utf-8').indexOf('rename__some').should.be.eql(-1);

            fs.readFileSync('test/megablock/__some/_foo/megablock__some_foo.css', 'utf-8').indexOf('.megablock__some_foo').should.not.eql(-1);
            fs.readFileSync('test/megablock/__some/_foo/megablock__some_foo_val.js', 'utf-8').indexOf('megablock__some_val').should.be.eql(-1);
        });
    });
});

function createTestBlock(){
    fs.mkdirpSync('test/rename');
    fs.writeFileSync('test/rename/rename.css', '.rename {  }');
    fs.writeFileSync('test/rename/rename.priv.js', "blocks.declare('rename', function (data) {");

    fs.mkdirpSync('test/rename/_mod');
    fs.writeFileSync('test/rename/_mod/rename_mod.css', '.rename_mod {  }');
    fs.writeFileSync('test/rename/_mod/rename_mod_val.js', "BEM.DOM.decl('rename_mod_val', {");

    fs.mkdirpSync('test/rename/__elem');
    fs.writeFileSync('test/rename/__elem/rename__elem.css', '.rename__elem {  }');
    fs.writeFileSync('test/rename/__elem/rename__elem.deps.js', 'shouldDeps: [rename__elem');

    fs.mkdirpSync('test/rename/__elem/_mod');
    fs.writeFileSync('test/rename/__elem/_mod/rename__elem_mod.css', '.rename__elem_mod {  }');
    fs.writeFileSync('test/rename/__elem/_mod/rename__elem_mod_val.js', "BEM.DOM.decl('rename__elem_mod_val', {");

    //garbage
    fs.writeFileSync('test/rename/rename.less');
    fs.mkdirpSync('test/rename/__elem/__wrong');
    fs.mkdirpSync('test/rename/_mod/_wrong');
}
