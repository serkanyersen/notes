/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] === "function" &&
        typeof _super[name] === "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();


var FieldModel = Class.extend({
  init: function(options) {
    options = options || {};
    this.defaultValue = options.empty;
  },
  setFieldName: function(name) {
    this.name = name;
  },
  get: function() {
    var value;
    if (this[this.name]) {
      value = this[this.name];
    } else if(typeof this.defaultValue === 'function') {
      value = this.defaultValue();
    } else {
      value = this.defaultValue;
    }
    return value;
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

var RelationField = FieldModel.extend({
  init: function(options) {
    options = options || {};
    this._super(options);
    this.relationObject = options.relation;
  },
  get: function() {
    return new this.relationObject();
  },
  set: function(value) {
    if(value instanceof this.relationObject) {
      this[this.name] = value.id;
    } else {
      this[this.name] = value;
    }
    return this[this.name];
  }
});

var DefaultField = FieldModel.extend({
  //set: function() {}
});

var DocumentModel = Class.extend({
  time_created: new DefaultField({ empty: function() { return +(new Date()); } }),
  time_updated: new DefaultField({ empty: function() { return +(new Date()); } }),

  init: function() {
    var field;
    for (var key in this) {
      field = this[key];
      if ('toCreateObject' in field) {
        field.setFieldName(key);
        Object.defineProperty(this, key, field.toCreateObject());
      }
    }
  },

  save: function() {},
  update: function() {},
  remove: function() {}
});

var User = DocumentModel.extend({
  username : new DefaultField(),
  email    : new DefaultField(),
  name     : new DefaultField()
});

var Note = DocumentModel.extend({
  title   : new DefaultField({ empty: 'Untitled' }),
  body    : new DefaultField({ empty: 'New Note' }),
  user    : new RelationField({ relation: User }),
  deleted : new DefaultField({ empty: false })
});


var note = new Note();
var user = new User();

note.user = 10;
console.log(note.user);
