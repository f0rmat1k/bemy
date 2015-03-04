module.exports = function (blocks) {
    blocks.declare('test', function (data) {
        return {
            block: 'test',
            content: [
                {
                    elem: ''
                }
            ]
        };
    });
};
