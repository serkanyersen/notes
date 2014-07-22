/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function() {
    var initializing = false,
        fnTest = /xyz/.test(function() {
            xyz;
        }) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    this.Class = function() {};

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
                (function(name, fn) {
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
            if (!initializing && this.init)
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

var DefaultField = FieldModel.extend({});

var DocumentModel = Class.extend({
    time_created: new DefaultField({ empty: function() { return +(new Date()); }}),
    time_updated: new DefaultField({ empty: function() { return +(new Date()); }}),

    init: function(data) {
        this._createFields();
        this._setData(data);
    },

    _setData: function(data) {
        for (var key in data) {
            this[key] = data[key];
        }
    },

    _setListener: function () {
        if(this.id) {
            var ref = this._getFirebaseRef();
            ref.on('value', function(snapshot) {
                this._setData(snapshot.val());
                this.id = snapshot.name();
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
            this._setData(data);
        }

        ref = this._getFirebaseRef();

        if (this.id) {
            ref.update(this.toObject());
            // This is update event
        } else {
            newRef = ref.push(this.toObject());
            this.id = newRef.name();
            // this is a new event
        }
    },

    remove: function() {
        var ref = this._getFirebaseRef();
        ref.remove();
        // this is remove item event
    }
});

var User = DocumentModel.extend({
    path: '/Users/',
    username: new DefaultField(),
    email: new DefaultField({ empty: '' })
});

var Note = DocumentModel.extend({
    path: function() {
        return '/Notes/' + this.user + '/';
    },
    title: new DefaultField({ empty: 'Untitled' }),
    body: new DefaultField({ empty: 'New Note' }),
    user: new RelationField({ relation: User }),
    deleted: new DefaultField({ empty: false })
});



// =========================
// App
var noteRef = new Firebase('https://intense-fire-5583.firebaseio.com/');
auth = new FirebaseSimpleLogin(noteRef, function(error, user) {
  if (error) {
    // an error occurred while attempting login
  } else if (user) {
    this.user = new User(user);
  } else {

  }
}.bind(this));
