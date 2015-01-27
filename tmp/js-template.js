BEM.DOM.decl('{{blockName}}{{elemName}}{{modName}}{{modVal}}', {
    onSetMod: {
        js: function () {
            this.collectData();
            this.bindEvents();
        }
    },

    collectData: function () {

    },

    bindEvents: function () {
        var self = this;
    }
});
