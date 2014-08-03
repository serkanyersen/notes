define(function(require) {
    var FieldModel = require('base/FieldModel');

    var RelationField = FieldModel.extend({
        init: function(options) {
            options = options || {};
            this._super(options);
            this.relationObject = options.relation;
        },
        set: function(value) {
            if (value instanceof this.relationObject) {
                this[this.name] = value.id;
            } else {
                this[this.name] = value;
            }
            return this[this.name];
        }
    });

    return RelationField;
});
