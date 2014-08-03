define(function(require) {
    var DocumentModel = require('base/DocumentModel');
    var DefaultField = require('models/DefaultField');
    var RelationField = require('models/RelationField');
    var User = require('models/User');

    var Note = DocumentModel.extend({
        title: new DefaultField({ empty: 'Untitled' }),
        body: new DefaultField({ empty: 'New Note' }),
        user: new RelationField({ relation: User }),
        deleted: new DefaultField({ empty: false }),

        path: function() {
            return '/Notes/' + this.user + '/';
        },

        trash: function() {
            this.save({ deleted: true });
        },

        untrash: function() {
            this.save({ deleted: false });
        }
    });

    return Note;
});
