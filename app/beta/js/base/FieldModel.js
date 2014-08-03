define(function (require) {
    var Class = require('utilities/Class');

    var FieldModel = Class.extend({
        init: function(options) {
            options = options || {};
            this.defaultValue = options.empty;
        },
        setFieldName: function(name) {
            this.name = name;
        },
        get: function() {
            if (this[this.name]) {
                this[this.name] = this[this.name];
            } else if (typeof this.defaultValue === 'function') {
                this[this.name] = this.defaultValue();
            } else {
                this[this.name] = this.defaultValue;
            }
            return this[this.name];
        },
        set: function(value) {
            this[this.name] = value;
            return this[this.name];
        },
        toCreateObject: function() {
            return {
                get: this.get.bind(this),
                set: this.set.bind(this)
            };
        },
        save: function() {},
        update: function() {},
        remove: function() {},
        toDBValue: function() {}
    });

    return FieldModel;
});
