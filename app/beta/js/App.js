define(function(require) {
    var PubSubClass = require('base/PubSubClass');
    var User = require('models/User');
    var NoteList = require('models/NoteList');
    var Firebase = require('Firebase');
    var FirebaseSimpleLogin = require('FirebaseSimpleLogin');

    var App = PubSubClass.extend({

        init: function () {
            this.noteRef = new Firebase('https://intense-fire-5583.firebaseio.com/');
            this.auth = new FirebaseSimpleLogin(this.noteRef, function(error, user) {
                if (error) {
                    // an error occurred while attempting login
                } else if (user) {

                    this.user = new User(user);
                    this.user.save();

                    this.noteList = new NoteList({ user: this.user });
                } else {

                }
            }.bind(this));
        }
    });

    return App;
});
