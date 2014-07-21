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
  init: function(name, defaultValue) {
    this.name = name;
    this.defaultValue = defaultValue;
  },
  get: function() {
    return this[this.name] || this.defaultValue;
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
  init: function(name, relationObject) {
    this.name = name;
    this.relationObject = relationObject;
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
  fields: {
    time_created: new DefaultField('time_created'),
    time_updated: new DefaultField('time_updated')
  },
  init: function() {
    for (var key in this.fields) {
      Object.defineProperty(this, key, this.fields[key].toCreateObject());
    }
  },
  save: function() {},
  update: function() {},
  remove: function() {}
});

var User = DocumentModel.extend({
  fields: {
    username: new DefaultField('username'),
    email: new DefaultField('email'),
    name: new DefaultField('name')
  },
  init: function(){
    this._super();
  }
});

var Note = DocumentModel.extend({
  fields: {
    title: new DefaultField('title', 'Untitled'),
    body: new DefaultField('body', 'New Note'),
    deleted: new DefaultField('deleted', false),
    user: new RelationField('user', User)
  },
  init: function(){
    this._super();
  }
});


var note = new Note();
var user = new User();

note.user = 10;
console.log(note.user);
