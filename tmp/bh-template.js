module.exports = function (bh) {
    bh.match('{{blockName}}{{elemName}}{{modName}}', function (ctx) {
        ctx.tag('div');
    });
};
