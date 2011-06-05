(function() {
    term = {};

    term.commands = {
        history: function () {
            var i;
            var output = [];
            var copy = this.cmdHistory.slice(0);

            copy.reverse();
            for (i = 0; i < copy.length; i++) {
                output += i +' '+ copy[i] +'<br />';
            }
            return output
        },

        '!': function(args) {
           var index = +args.shift() + 1;
           return this.evaluate(this.cmdHistory[this.cmdHistory.length - index]);
        },

        help: function(args) {
            var output = 'Available commands: \n\n';
            for (command in term.commands) {
                if (term.commands.hasOwnProperty(command)) {
                    output += utils.sprintf('%-10s', command);
                }
            }
            return output;
        }
    }
    
    term.Terminal = Backbone.Model.extend({
        evaluate: function(string) {
            var key;
            var command;

            switch (string[0]) {
                case '!':
                    command = string.split('');
                    break;
                default:
                    this.cmdHistory.unshift(string);
                    command = string.match(/[^ ]+/g);
                    break;
            }

            try {
                if (_.isFunction(term.commands[command[0]])) {
                    return term.commands[command[0]].call(this, _.tail(command));
                }
                throw new Error('Command not found');
            }
            catch (err) {
                return err.toString();
            }
        },

        validate: function(attrs) {

            // validate that history index stays within the range of the cmdHistory array
            if (attrs.historyIndex) {
                if (attrs.historyIndex < 0 || attrs.historyIndex >= this.cmdHistory.length) {
                    return 'error: out of array bounds';
                }
            }
        },

        cmdHistory: [],
        
        defaults: {
            'stdout': 'Welcome to term.js',
            'historyIndex': -1
        }
    });

    term.TerminalView = Backbone.View.extend({
        initialize: function() {
            
            _.bindAll(this, 'respond', 'enter', 'promptKeypress', 'showHistory');
            this.model.bind('change:stdout', this.respond);
            this.model.bind('change:historyIndex', this.showHistory);
        },
        
        tagName: 'div',
        className: 'terminal',

        events: {
            'click': 'grabFocus',
            'keydown': 'promptKeypress',
        },
        
        responseTemplate: _.template($('.terminal-template').html()),

        grabFocus: function(e) {
            if (!$(e.srcElement).is(this.$prompt)) {
                this.caretToEnd(this.$prompt[0]);
            }
        },
        
        respond: function() {
            $el = $(this.el);
            var $template = $(this.responseTemplate(this.model.toJSON()));
            $el.append($template);
            this.$prompt.attr('contenteditable', false);
            this.$prompt = $template.filter('.prompt');
            this.caretToEnd(this.$prompt[0]);
        },

        promptKeypress: function(e) {
            
            switch (e.keyCode) {
                case $.ui.keyCode.ENTER:
                    e.preventDefault();
                    this.enter()
                    break;
                case $.ui.keyCode.UP:
                    e.preventDefault();
                    this.cycleHistory('up');
                    break;
                case $.ui.keyCode.DOWN:
                    e.preventDefault();
                    this.cycleHistory('down');
                    break;
                case $.ui.keyCode.TAB:
                    e.preventDefault();
                    this.tabComplete(e);
            }
        },

        tabComplete: function() {
            var fragment = this.$prompt.text();
            var matches = []
            for (command in term.commands) {
                if (term.commands.hasOwnProperty(command)) {
                    if (command.indexOf(fragment) === 0) {
                        matches.push(command);
                    }
                }
            }

            if (matches.length) {
                var i;
                var output = '';
                if (matches.length === 1) {
                    this.$prompt.text(matches[0] + ' ');
                    this.caretToEnd(this.$prompt[0]);
                } else {
                    for (i = 0; i < matches.length; i++) {
                        output += utils.sprintf('%-10s', matches[i]);
                    }
                    
                    if (output === this.model.get('stdout')) {
                        this.model.trigger('change:stdout');
                    } else {
                        this.model.set({'stdout': output});
                    }
                }
            }
        },

        cycleHistory: function(direction) {
            var inc = direction == 'up' ? 1 : -1;
            this.model.set({'historyIndex': this.model.get('historyIndex') + inc});
        },

        showHistory: function() {
            this.$prompt.text(this.model.cmdHistory[this.model.get('historyIndex')]);
            this.caretToEnd(this.$prompt[0]);
            var sel = window.getSelection();
            sel.addRange();
            var range = sel.getRangeAt(0);
        },
        
        enter: function() {
            this.model.attributes.historyIndex = -1;
            var stdout = this.model.evaluate(this.$prompt.text());
            
            // trigger change on stdout if it wont be triggered normally
            if (stdout === this.model.get('stdout')) {
                this.model.trigger('change:stdout');
            } else {
                this.model.set({'stdout': stdout});
            }
        },

        render: function() {
            var $template = $(this.responseTemplate(this.model.toJSON()));
            $(this.el).html($template);
            this.$prompt = $template.filter('.prompt');
            
            return this
        },
        
        caretToEnd: function(contentEditableElement) {
            var range,selection;
            range = document.createRange();//Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection();//get the selection object (allows you to change selection)
            selection.removeAllRanges();//remove any selections already made
            selection.addRange(range);
        }    
        
    });
    
})()
