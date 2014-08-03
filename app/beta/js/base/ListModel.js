define(function(require) {
    var PubSubClass = require('base/PubSubClass');
    var DocumentModel = require('base/DocumentModel');

    var ListModel = PubSubClass.extend({
        items: [],
        Model: DocumentModel,

        init: function(options) {
            options = options || {};
            this.setData(options);
            this._setListener();
        },

        getPath: function() {
            if (typeof this.path === 'function') {
                return this.path();
            } else {
                return this.path;
            }
        },

        setData: function(data) {
            for (var key in data) {
                this[key] = data[key];
            }
        },

        _getFirebaseRef: function() {
            var firebase = "https://intense-fire-5583.firebaseio.com",
                path = this.getPath(),
                ref;

            ref = new Firebase(firebase + path);

            return ref;
        },

        _listReadSuccess: function(snapshot) {
            this.fire('read', snapshot);
        },

        _listReadFail: function() {
            this.fire('notread');
        },

        _setListener: function () {
            var ref = this._getFirebaseRef();

            ref.on('value', this._listReadSuccess.bind(this), this._listReadFail.bind(this));

            ref.on('child_added', function(snapshot) {
                this.addItem(snapshot.val());
            }.bind(this));

            ref.on('child_removed', function(snapshot) {
                this.removeItem(snapshot.name());
            }.bind(this));

            ref.on('child_changed', function(snapshot) {
                this.updateItem(snapshot.name(), snapshot.val());
            });
        },

        indexOf: function(id) {
            var result = false;
            this.items.forEach(function(item, i) {
                if (item.id === id) {
                    result = i;
                }
            });
            return result;
        },

        addItem: function(data) {
            var model = new this.Model(data);
            this.items.push(model);
            this.fire('child:added', model);
        },

        removeItem: function(id) {
            var index = this.indexOf(id),
                removedChild;

            if (index) {
                removedChild = this.items.splice(index, 1);
                this.fire('child:removed', removedChild[0]);
            }
        },

        updateItem: function(id, data) {
            var index = this.indexOf(id);
            if (index) {
                this.items[index].setData(data);
                this.fire('child:updated', this.items[index]);
            }
        }
    });

    return ListModel;
});
