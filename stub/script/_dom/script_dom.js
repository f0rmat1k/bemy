/**
 * @module {{blockName}}{{elemName}}{{modName}}{{modVal}}
 */
modules.define('{{blockName}}{{elemName}}{{modName}}{{modVal}}', ['i-bem__dom'], function (provide, BEMDOM) {

    /**
     * @class {{blockName}}{{elemName}}{{modName}}{{modVal}}
     */
    BEMDOM.decl(this.name, /** @lends {{blockName}}{{elemName}}{{modName}}{{modVal}}.prototype */ {

        onSetMod: {
            'js': {
                'inited': function () {
                    {{cursor}}
                }
            }
        }

    }, /** @lends {{blockName}}{{elemName}}{{modName}}{{modVal}} */ {
        live: function () {
            this.liveInitOnEvent('pointerover');
        }
    });

    /**
     * @exports {{blockName}}{{elemName}}{{modName}}{{modVal}}
     */
    provide(BEMDOM);

});
