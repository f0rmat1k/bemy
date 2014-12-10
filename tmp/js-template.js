BEM.DOM.decl('{{blockName}}{{elemName}}{{modName}}', {
    onSetMod: {
        js: function () {
            this.collectElems();
            this.bindEvents();
        }
    },

    collectElems: function () {

    },

    bindEvents: function () {
        var self = this;
    }
});
