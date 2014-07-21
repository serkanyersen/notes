var ObjectEvents = (function(global, undef) {

    var Events = function() {
        this.listeners = {};
    };

    Events.prototype.on = function(name, callback, context) {
        var names = name.split(/\s+/);
        names.forEach(function(name) {
            if (!this.listeners[name]) {
                this.listeners[name] = [];
            }
            this.listeners[name].push(callback.bind(context || this));
        }.bind(this));
        return this;
    };

    Events.prototype.fire = function(name) {
        var names = name.split(/\s+/),
            memo = Array.prototype.slice.call(arguments);
        memo.shift();
        names.forEach(function(name) {
            if (this.listeners[name]) {
                this.listeners[name].forEach(function(callback) {
                    if (memo) {
                        callback.apply(this, memo);
                    } else {
                        callback.call(this);
                    }
                });
            }
        }.bind(this));
        return this;
    };

    return Events;
})(this);


var NotesCore = (function(win, undef) {

    var Core,
        firebase = "https://intense-fire-5583.firebaseio.com/",
        untitledName = "Untitled",
        untitledBody = "New Note";

    /**
     * Core class constructor
     * it authenticates the user and
     * initializes the search index
     */
    Core = function() {
        // Empty list of notes
        this.notes = [];
        this.user = {};

        this.authenticate(function() {
            // load all the notes
            this.readNotes();
        }.bind(this));

        this.idx = lunr(function () {
          this.ref('id');

          this.field('title', { boost: 10 });
          this.field('body');
        });
    };

    Core.prototype.events = new ObjectEvents();

    Core.prototype.addSearchIndex = function(snapshot) {
        var note = snapshot.val();
        this.idx.add({
            id: snapshot.name(),
            title: note.title,
            body: note.body
        });
    };

    Core.prototype.updateSearchIndex = function(snapshot) {
        var note = snapshot.val();
        this.idx.update({
            id: snapshot.name(),
            title: note.title,
            body: note.body
        });
    };

    Core.prototype.removeSearchIndex = function(snapshot) {
        this.idx.remove(snapshot.name());
    };

    Core.prototype.search = function(keyword) {
        var result = this.idx.search(keyword);
        return _(result).chain().sortBy(function(r) { return r.score; }).map(function(r) {
            return _(this.notes).where({ url: this.user.username + "/" + r.ref })[0];
        }.bind(this)).value();
    };

    Core.prototype.getPath = function(snapshot) {
        return this.user.username + '/' + snapshot.name();
    };

    Core.prototype.authenticate = function(callback) {
        var noteRef = new Firebase(firebase);

        this.auth = new FirebaseSimpleLogin(noteRef, function(error, user) {
          if (error) {
            // an error occurred while attempting login
          } else if (user) {
            this.user = user;
            this.notes = [];
            this.events.fire('user:loggedin', user);
          } else {
            this.events.fire('user:loggedout');
            this.notes = [];
          }
          this.events.fire('auth:done', user, error);
          callback();
        }.bind(this));
    };

    Core.prototype.getNoteList = function(trash) {
        return _(this.notes).chain().sortBy(function(n){
                    return n.time_updated;
                }).reverse().where({
                    deleted: !!trash
                }).value();
    };

    Core.prototype.getNoteListCount = function(trash) {
        return this.getNoteList(trash).length;
    };

    Core.prototype.readNotes = function() {
        var notesRef = new Firebase(firebase + this.user.username);
        if(!this.user){
            return;
        }
        this.notes = [];

        notesRef.off("value");
        notesRef.on("value", this.notesChildReadSuccess.bind(this),
                             this.notesChildReadSuccess.bind(this));

        notesRef.off("child_added");
        notesRef.on("child_added", this.notesChildAdded.bind(this));

        notesRef.off("child_changed");
        notesRef.on("child_changed", this.notesChildChanged.bind(this));

        notesRef.off("child_removed");
        notesRef.on("child_removed", this.notesChildRemoved.bind(this));
    };

    Core.prototype.notesChildReadSuccess = function(snapshot) {
        this.events.fire('notes:read', snapshot);
    };

    Core.prototype.notesChildReadFail = function(snapshot) {
        this.events.fire('notes:notread');
    };

    Core.prototype.notesChildAdded = function (snapshot) {
        var note = snapshot.val();
        note.url = this.getPath(snapshot);
        note.snapshot = snapshot;
        this.notes.push(note);
        this.addSearchIndex(snapshot);
        this.events.fire("note:added", snapshot);
        this.events.fire("notes:changed", "added", snapshot);
    };

    Core.prototype.notesChildChanged = function (snapshot) {
        var note = snapshot.val(),
            url = this.getPath(snapshot),
            savedNote = _(this.notes).findWhere({
                url: url
            });
        savedNote.body = note.body;
        savedNote.title = note.title;
        this.updateSearchIndex(snapshot);
        this.events.fire("note:changed");
        this.events.fire("notes:changed", "changed", snapshot);
    };

    Core.prototype.notesChildRemoved = function (snapshot) {
        this.notes = _(this.notes).reject(function (note) {
            return note.url === this.getPath(snapshot);
        });
        this.removeSearchIndex(snapshot);
        this.events.fire("note:removed");
        this.events.fire("notes:changed", "removed", snapshot);
    };

    Core.prototype.addNote = function() {
        var newNoteRef,
            notesRef,
            existingNew = _(this.notes).chain().where({ deleted: false }).find(function(n){
                return n.title === untitledName;
            }).value();

        if(existingNew === undefined) {
            notesRef = new Firebase(firebase + this.user.username);
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
        this.events.fire('note:created', newNoteRef);
    };

    Core.prototype.readNote = function(id) {
        var noteRef = new Firebase(firebase + id);

        noteRef.on("value", function (snapshot) {
            if(snapshot.val()) {
                this.events.fire('note:read', snapshot);
            }
        }.bind(this));
    };

    Core.prototype.updateNote = function(id, text) {
        var noteRef = new Firebase(firebase + id),
            note = _(this.notes).where({url: id})[0],
            plainText = text.replace(/<div/gim, '\n<div')
                            .replace(/<br/gim, '\n<br')
                            .replace(/(<([^>]+)>)/gim, '')
                            .trim();

            title = plainText.split(/\n/)[0];
            title = title.replace(/[\*\#]/gim, '');
            title = title.trim();

        if (title === untitledBody) {
            title = untitledName;
        }

        if (note && (note.title !== title || note.body !== text)) {
            noteRef.update({
                time_updated: +(new Date()),
                title: title || untitledName,
                body: text || untitledBody
            });
        }
    };

    Core.prototype.deleteNote = function(id) {
        var noteRef = new Firebase(firebase + id);
        noteRef.remove();
        this.events.fire('note:deleted', id);
    };

    Core.prototype.trashNote = function(id) {
        var noteRef = new Firebase(firebase + id);
        noteRef.update({
            deleted: true
        });
        this.events.fire('note:trashed', id);
    };

    Core.prototype.untrashNote = function(id) {
        var noteRef = new Firebase(firebase + id);
        noteRef.update({
            deleted: false
        });
        this.events.fire('note:trashed', id);
    };

    return Core;
})(this);
