BEM.DOM.decl('{{blockName}}{{elemName}}', {
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
