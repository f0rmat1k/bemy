module.exports = function (bh) {
    bh.match('{{blockName}}{{elemName}}{{modName}}{{modVal}}', function (ctx) {
        {{cursor}}ctx.tag('div');
    });
};
