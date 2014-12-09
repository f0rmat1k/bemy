module.exports = function (bh) {
    bh.match('{{blockName}}{{elemName}}', function (ctx) {
        ctx.tag('tag');
    });
};
