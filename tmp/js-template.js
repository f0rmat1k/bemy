BEM.DOM.decl('{{blockName}}{{elemName}}{{modName}}', {
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
