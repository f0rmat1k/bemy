module.exports = function (blocks) {
    blocks.declare('{{blockName}}{{elemName}}{{modName}}{{modVal}}', function (data) {
        return {
            block: '{{blockName}}',
            content: [
                {
                    elem: ''
                }
            ]
        };
    });
};
