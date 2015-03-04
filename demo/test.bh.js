module.exports = function (bh) {
    bh.match('test', function (ctx) {
        ctx.tag('div');
    });
};
