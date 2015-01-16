module.exports = function (blocks) {
    blocks.declare('{{blockName}}{{elemName}}{{modName}}', function (data) {
        return {
            block: '{{blockName}}',
            content: ''
        };
    });
};
