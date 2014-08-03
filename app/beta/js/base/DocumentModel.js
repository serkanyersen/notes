define(function (require) {
    var PubSubClass = require('base/PubSubClass');
    var DefaultField = require('models/DefaultField');

    var DocumentModel = PubSubClass.extend({
        time_created: new DefaultField({ empty: function() { return +(new Date()); }}),
        time_updated: new DefaultField({ empty: function() { return +(new Date()); }}),

        init: function(data) {
            this._createFields();
            this.setData(data);
        },

        setData: function(data) {
            for (var key in data) {
                this[key] = data[key];
            }
        },

        _setListener: function () {
            if (this.id) {
                var ref = this._getFirebaseRef();
                ref.on('value', function(snapshot) {
                    this.setData(snapshot.val());
                    this.id = snapshot.name();
                    this.fire('read');
                }.bind(this));
            }
        },

        _createFields: function() {
            var field, key;
            for (key in this) {
                field = this[key];
                if (typeof field.toCreateObject === 'function') {
                    field.setFieldName(key);
                    Object.defineProperty(this, key, field.toCreateObject());
                }
            }
        },

        getPath: function() {
            if (typeof this.path === 'function') {
                return this.path();
            } else {
                return this.path;
            }
        },

        toObject: function() {
            var object = {};

            for (var key in this) {
                if (this[key] !== 'function') {
                    if (this.hasOwnProperty(key) && "path id".indexOf(key) === -1) {
                        object[key] = this[key];
                    }
                }
            }

            return object;
        },

        _getFirebaseRef: function() {
            var firebase = "https://intense-fire-5583.firebaseio.com/",
                path = this.getPath(),
                ref;
            if (this.id) {
                path += '/' + this.id;
            }
            ref = new Firebase(firebase + path);

            return ref;
        },

        save: function(data) {
            var ref, newRef;

            if(data) {
                this.setData(data);
            }

            ref = this._getFirebaseRef();

            // Update time
            this.time_updated = +(new Date());

            if (this.id) {
                ref.update(this.toObject());
                this.fire('updated', ref);
            } else {
                newRef = ref.push(this.toObject());
                this.id = newRef.name();
                this.fire('created', newRef);
            }
        },

        remove: function() {
            var ref = this._getFirebaseRef();
            ref.remove();
            this.fire('removed', ref);
        }
    });

    return DocumentModel;
});
