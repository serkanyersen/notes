define(function(require) {

    var Class = require('utilities/Class');

    var PubSubClass = Class.extend({
        __listeners: {},

        on: function(name, callback, context) {
            var names = name.split(/\s+/);
            names.forEach(function(name) {
                if (!this.__listeners[name]) {
                    this.__listeners[name] = [];
                }
                this.__listeners[name].push(callback.bind(context || this));
            }.bind(this));

            return this;
        },

        fire: function(name) {
            var names = name.split(/\s+/),
                memo = Array.prototype.slice.call(arguments);
            memo.shift();
            names.forEach(function(name) {
                if (this.__listeners[name]) {
                    this.__listeners[name].forEach(function(callback) {
                        if (memo) {
                            callback.apply(this, memo);
                        } else {
                            callback.call(this);
                        }
                    });
                }
            }.bind(this));

            return this;
        },

        off: function(name, callbackToRemove) {
            var eventIndex = false;

            // Find and remove specific callback
            if (callbackToRemove) {
                (this.__listeners[name] || []).forEach(function(func, i) {
                    if (func === callbackToRemove) {
                        eventIndex = i;
                    }
                });
                if (eventIndex !== false) {
                    this.__listeners[name].splice(eventIndex, 1);
                }
            } else {
                // Empty out all callbacks for given event
                this.__listeners[name] = [];
            }

            return this;
        }
    });

    return PubSubClass;
});
