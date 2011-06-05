(function() {

    
    var terminal = utils.instantiate(term.Terminal, term.TerminalView);
    
    $('.body').append(terminal.view.render().el);
    
})();