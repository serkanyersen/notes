define(function(require) {
    var ListModel = require('base/ListModel');
    var Note = require('models/Note');
    var _ = require('underscore');

    var NoteList = ListModel.extend({
        Model: Note,

        path: function() {
            return '/Notes/' + this.user.id + '/';
        },

        getNotes: function() {
            return _(this.items).chain().sortBy(function(n){
                        return n.time_updated;
                    }).reverse().where({
                        deleted: false
                    }).value();
        },

        getTrash: function() {
            return _(this.items).chain().sortBy(function(n){
                        return n.time_updated;
                    }).reverse().where({
                        deleted: true
                    }).value();
        },

        cleanTrash: function() {

        }
    });

    return NoteList;
});
