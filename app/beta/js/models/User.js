define(function(require) {
    var DocumentModel = require('base/DocumentModel');
    var DefaultField = require('models/DefaultField');

    var User = DocumentModel.extend({
        path: '/Users/',
        username: new DefaultField(),
        email: new DefaultField({ empty: '' })
    });

    return User;
});
