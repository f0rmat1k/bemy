module.exports = function (bh) {
    bh.match('{{blockName}}{{elemName}}{{modName}}{{modVal}}', function (ctx) {
        ctx.tag('div');
    });
};
