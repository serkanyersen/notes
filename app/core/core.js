var NotesCore = (function(win, undef) {

    var firebase = "https://intense-fire-5583.firebaseio.com/";
        untitledName = "Untitled",
        untitledBody = "New Note",
        Core = function() {
            var self = this;
            self.notes = [];
            this.authenticate(function() {
                // load all the notes
                self.getNotes();
            });
        };

    Core.prototype.authenticate = function(callback) {
        var self = this,
            noteRef = new Firebase(firebase);

        this.auth = new FirebaseSimpleLogin(noteRef, function(error, user) {
          if (error) {
            // an error occurred while attempting login
          } else if (user) {
            self.user = user;
            self.notes = [];
            $(self).trigger('user:loggedin', [user]);
          } else {
            $(self).trigger('user:loggedout');
            self.notes = [];
          }
          $(self).trigger('auth:done', [user, error]);
          callback();
        });
    };

    Core.prototype.getNotes = function() {
        this.notes = [];
        var self = this,
            notesRef = new Firebase(firebase + "notes");

        notesRef.off("value");
        notesRef.on("value", function(snapshot) {
            $(self).trigger('notes:read', [snapshot]);
        }, function() {
            $(self).trigger('notes:notread');
        });

        notesRef.off("child_added");
        notesRef.on("child_added", function (snapshot) {
            var note = snapshot.val();
            note.url = snapshot.name();
            note.snapshot = snapshot;
            self.notes.push(note);
            $(self).trigger("note:added");
        });
        notesRef.off("child_changed");
        notesRef.on("child_changed", function (snapshot) {
            var note = snapshot.val(),
                url = snapshot.name(),
                savedNote = _(self.notes).findWhere({
                    url: url
                });
            savedNote.body = note.body;
            savedNote.title = note.title;
            $(self).trigger("note:changed");
        });
        notesRef.off("child_removed");
        notesRef.on("child_removed", function (snapshot) {
            self.notes = _(self.notes).reject(function (note) {
                return note.url === snapshot.name();
            });
            $(self).trigger("note:removed");
        });
    };

    Core.prototype.getNote = function(id) {
        var self = this,
            noteRef = new Firebase(firebase + 'notes/' + id);

        noteRef.off("value");
        noteRef.on("value", function (snapshot) {
            if(snapshot.val()) {
                $(self).trigger('note:read', [snapshot]);
            }
        });
    };

    Core.prototype.addNewNote = function() {
        var self = this,
            newNoteRef,
            notesRef,
            existingNew = _(self.notes).find(function(n){
                return n.title === untitledName;
            });

        if(existingNew === undefined) {
            notesRef = new Firebase(firebase + "notes");
            newNoteRef = notesRef.push({
                userid: this.user.uid,
                time_created: +(new Date()),
                time_updated: +(new Date()),
                title: untitledName,
                body: untitledBody,
                deleted: false
            });
        } else {
            newNoteRef = existingNew.snapshot;
        }
        $(this).trigger('note:created', [newNoteRef]);
    };

    Core.prototype.trashNote = function(id) {
        var noteRef = new Firebase(firebase + "notes/" + id);
        noteRef.update({
            deleted: true
        });
        $(this).trigger('note:trashed', [id]);
    };

    Core.prototype.untrashNote = function(id) {
        var noteRef = new Firebase(firebase + "notes/" + id);
        noteRef.update({
            deleted: false
        });
        $(this).trigger('note:trashed', [id]);
    };

    Core.prototype.deleteNote = function(id) {
        var noteRef = new Firebase(firebase + "notes/" + id);
        noteRef.remove();
        $(this).trigger('note:deleted', [id]);
    };

    Core.prototype.updateNote = function(id, text) {
        var noteRef = new Firebase(firebase + "notes/" + id),

            plainText = text.replace(/<div/gim, '\n<div')
                            .replace(/<br/gim, '\n<br')
                            .replace(/(<([^>]+)>)/gim, '')
                            .trim(),

            title = plainText.split(/\n/)[0];
            title = title.replace(/[\*\#]/gim, '');
            title = title.trim();

        if (title === untitledBody) {
            title = untitledName;
        }

        noteRef.update({
            time_updated: +(new Date()),
            title: title || untitledName,
            body: text || untitledBody
        });
    };

    return Core;
})(this);
