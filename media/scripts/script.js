(function() {

    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g,
        evaluate: /\{\%(.+?)\%\}/g
    }
    
    var instantiate = function(model, view) {
        var model = new model();
        return {model: model, view: new view({model: model})};
    }
    
    var terminal = instantiate(Terminal, TerminalView);
    
    $('.body').append(terminal.view.render().el);
    
})();