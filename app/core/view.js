var NotesVew = (function(win, undef) {

    var View = function(core) {
        var self = this;
        self.summernote = $('.summernote');
        self.listTemplate = '#list-item';
        self.trashTemplate = '#trash-list-item';
        self.template = self.listTemplate;
        if (win.CodeMirror) {
            self.codemirror = CodeMirror($('.editor')[0], {
              mode:  'markdown',
              keyMap: 'sublime',
              indentUnit: 2,
              textWrapping: true,
              tabSize: 4,
              tabMode: 'shift',
              lineNumbers: true,
              extraKeys: {
                "Ctrl-S": function(instance) { },
                "Cmd-S": function(instance) { }
              },
              theme: 'solarized light'
            });
        }
        self.core = core;

        self.initEditor();

        // Check for page changes
        $(self.core).on('auth:done', function(e, user, error){
            self.getPageChange();
        });

        // Add new button is always there
        $('.add-new').on('click', function() {
            self.core.addNewNote();
        });

        // because links are created after screen is initialized
        $('.list-group').on('click', '.trash-note', function(e){
            e.preventDefault();
            e.stopPropagation();
            self.core.trashNote($(this).data('id'));
            self.core.getNotes();
        });

        // because links are created after screen is initialized
        $('.list-group').on('click', '.untrash-note', function(e){
            e.preventDefault();
            e.stopPropagation();
            self.core.untrashNote($(this).data('id'));
            self.core.getNotes();
        });

        // because links are created after screen is initialized
        $('.list-group').on('click', '.remove-note', function(e){
            if(confirm('are you sure')){
                e.preventDefault();
                e.stopPropagation();
                self.core.removeNote($(this).data('id'));
                self.core.getNotes();
            }
        });

        $('.login').on('click', function() {
            self.core.auth.login('github');
        });

        $('.logout').on('click', function() {
            self.core.auth.logout();
        });

        $('#expand').on('click', function() {
            self.toggleSideBar();
        });

        $(core).on('user:loggedin', function(e, user){
            $('.logged-in').show();
            $('.logged-out').hide();
            $('.username').html(user.displayName);
        }).on('user:loggedout', function(){
            $('.logged-in').hide();
            $('.logged-out').show();
            $('#side-bar, #expand, .preview-btn, #search').hide();
            $('.preview').show();
        }).on('notes:read', function(e, spanshot) {
            if(self.getPage() === ''){
                self.openFirstNote();
            }
            $('#side-bar, #expand, .preview-btn, #search').show();
            $('.preview').hide();
        }).on('notes:notread', function() {
            $('#side-bar, #expand, .preview-btn, #search').hide();
            $('.preview').show();
        }).on('note:added note:changed note:removed', function (data) {
            var html = _($(self.template).html()).template({
                'notes': _(self.core.notes).chain().sortBy(function(n){
                            return n.time_updated;
                        }).reverse().where({
                            deleted: self.template === self.trashTemplate
                        }).value()
            });
            $('#note-list').html(html);
            $('.trash-count').html(_(self.core.notes).where({ deleted: true }).length);
        }).on('note:read', function(e, snapshot) {
            var note = snapshot.val();

            if (self.codemirror) {
                if(self.codemirror.getValue() !== note.body){
                    self.codemirror.setValue(note.body.replace(/<br\>/gim, '\n'));
                    self.codemirror.clearHistory();
                    $('.note-date').html(moment(note.time_created).fromNow());
                    $('.preview').html(markdown.toHTML(note.body));
                }
            } else {
                if(self.summernote.code() !== note.body){
                    self.summernote.code(note.body.replace(/\n/gim, '<br>'));
                    self.summernote.focus();

                    if(!self.core.user) {
                        self.summernote.destroy();
                    }
                }
            }

        }).on('note:created', function(e, newNoteRef){
            self.setPage(self.core.getPath(newNoteRef));
        }).on('note:deleted', function(e, id) {
            if (id === self.getPage() || $('.notes').length === 0) {
                self.openFirstNote();
            }
        });

        $('.toggle-trash').on('click', function() {
            if (self.template === self.listTemplate) {
                self.template = self.trashTemplate;
                $('.trash-text').html('Close trash');
            } else {
                self.template = self.listTemplate;
                $('.trash-text').html('Open trash');
            }
            self.core.getNotes();
        });

        $('#search').on('keyup', _.debounce(function(e) {
            var keyword = $(this).val().trim();
            if (keyword) {
                var html = _($('#search-item').html()).template({
                    'notes': self.core.search(keyword)
                });
                $('#search-list').html(html).show();
                $('#note-list').hide();
            } else {
                $('#search-list').html('').hide();
                $('#note-list').show();
            }
        }, 100));

        $('.preview-btn').on('click', function(){
            if($('.preview').is(':visible')) {
                $(this).html('Preview');
                $('.preview').hide();
            } else {
                $(this).html('Edit');
                $('.preview').show();
            }

        });

        Mousetrap.bind(['meta+s', 'ctrl+s', 'command+s'], function(e) {
            return false;
        });

        Mousetrap.bind(['meta+n', 'ctrl+n', 'command+n'], function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                // internet explorer
                e.returnValue = false;
            }
            self.core.addNewNote();
            return false;
        });
    };

    View.prototype.getPageChange = function() {
        var self = this;
        var change = function () {
            var page = self.getPage();
            self.core.getNote(page);
            $('.active').removeClass('active');
            $('[href="' + win.location.hash + '"]').addClass('active');
        };

        $(win).off('hashchange')
              .on('hashchange', change);
        if (win.location.hash) {
            change();
        }
    };

    View.prototype.setPage = function(id) {
        win.location.hash = id;
    };

    View.prototype.getPage = function() {
        return win.location.hash.replace('#', '');
    };

    View.prototype.openFirstNote = function() {
        if( $('.notes').length > 0 ) {
            $('.notes')[0].click();
        } else {
            this.core.addNewNote();
        }
    };

    View.prototype.toggleSideBar = function() {
        if($('#side-bar').is(':visible')){
            $('#side-bar').hide();
        } else {
            $('#side-bar').show();
        }
    };

    View.prototype.initEditor = function() {
        var self = this;

        if (self.codemirror) {
            self.codemirror.on('change', _.debounce(function(contents){
                self.core.updateNote(self.getPage(), self.codemirror.getValue());
                self.core.getNotes();
            }, 1000));

            self.codemirror.setSize('auto', '100%');
            self.summernote.hide();
        } else {
            self.summernote.destroy();
            self.summernote.summernote({
                airMode: true,
                focus: true,
                onChange: _.debounce(function(contents){
                    self.core.updateNote(self.getPage(), self.summernote.code());
                }, 1000)
            });
        }

    };

    return View;

})(this);
