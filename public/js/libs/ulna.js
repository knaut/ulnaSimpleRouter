(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var extend = require('./extend');

// COMPONENTS
// Like Marionette or Backbone views, but able to be nested within a recursive tree-like hierarchy

var Component = function(obj) {
	this._lifecycle = ['beforeUpdate', 'onUpdate', 'afterUpdate'];
	this._lifecycleTimeout = true;
	this.id = _.uniqueId('c');
	this.children = [];

	for (var prop in obj) {
		this[prop] = obj[prop];
	}

	this.initialize.apply(this, arguments);
};

var proto = {
	initialize: function() {
		this.setStore();

		if (typeof this.$el === 'string') {
			this.$el = $(this.$el);

			if (this.template) {
				this.render();
			}
		} else {
			// if we haven't supplied an $el, we're probably populating children
			this.renderAsChild();
		}

		if (this.store) {
			this.bindInternals();
		}
	
		if (this.data.hasOwnProperty('children')) {
			this.createChildren();
		}

		if (this.events) {
			this.bindEvents();
		}
	},
	deinitialize: function() {
		if (this.store) {
			this.store.deinitialize();
		}

		if (this.data.hasOwnProperty('children')) {
			this.destroyChildren();
		}

		this.unrender();
	},
	setStore: function() {
		// meant to be overriden
		// stores may not always be needed for a component
		// you can overrule this function to set your store during initialization
		return false;
	},
	setComponentData: function() {
		if (this.store) {
			this.data = this.store.getCurrentProps();
		} else {
			console.log('Warning: setComponentData fired, but no store to get props from')
		}
	},

	render: function() {
		var template = _.template( this.template );
		template = template( this.data );

		this.$el.css({
			visibility: 'hidden'	// hide any incoming html first, use showElement to unhide
		});
		this.$el.html( template );
		this.showElement();
	},

	renderAsChild: function() {
		var template = _.template( this.template );
		template = template( this.data );

		this.$el = $( template );
	},

	showElement: function() {
		this.$el.fadeIn(); 
		this.$el.css({
			visibility: 'visible'
		});
	},

	unrender: function() {
		// place to do fadeout animations
		// this may need a queue to do things properly
		this.$el.fadeOut();
		this.$el.css({
			visibility: 'hidden'
		});
		this.$el.empty();
	},

	// internal events only, like componentUpdate and propsSet
	bindInternals: function() {
		this.store.on( 'componentUpdate', this.startUpdate, this );
	},
	unbindInternals: function() {
		this.store.off( 'componentUpdate', this.startUpdate, this );
	},

	bindEvents: function() {
		var regex = /^(\w+)/;
		for (var prop in this.events) {
			var eventString = regex.exec(prop)[0];
			if (eventString.indexOf('key') > -1) {
				$(document).on(eventString, _.bind(this[this.events[prop]], this));
			} else {
				var reg = /[\S]*$/;

				this.$el.find(reg.exec(prop)[0]).on(eventString, _.bind(this[this.events[prop]], this));
			}
		}
	},
	unbindEvents: function() {
		var regex = /^(\w+)/;
		for (var prop in this.events) {
			var eventString = regex.exec(prop)[0];
			if (eventString.indexOf('key') > -1) {
				$(document).off(eventString, _.bind(this[this.events[prop]], this));
			} else {
				var reg = /[\S]*$/;

				this.$el.find(reg.exec(prop)[0]).off(eventString, _.bind(this[this.events[prop]], this));
			}
		}
	},

	hasChildBasedOnId: function() {
		var hasChild = false;
		$.each(this.children, function() {
			if (this.cid === cid) {
				hasChild = true;
			}
		}, this);
		return hasChild;
	},
	getChildByType: function( node ) {
		// iterate over this.childType, returning the necessary constructor references
		// based on the 'name' of the current prop's child node
		/* 
		i.e. sample props:
		
		children : [
			{ name: 'myChildType',
			  data: 'some data'},
			{ name: 'otherChildType'
			  data: 'other data' }
		]

		in your constructor:

		childType: {
			myChildType: myChildType	// the first is a key (string), the second is your require() reference
			otherChildType: otherChildType
		}
		*/

		// would be nice to have the node keys dynamically set by the developer
		for (var prop in this.childType) {
			if (prop === node.name) {
				return this.childType[prop];
			}
		}
	},

	getTemplate: function() {
		// look for a 'type' property associated with a given child node
		// if the type matches a template's key in an object hash, we return that template
		// if not, we just pass the template as normal
		if (typeof this.template === 'object') {

			if ( Object.keys(this.data).length === 1 ) {
				// only one key, we've just inited with no real data
				return this.template.default;
			} else {

				for ( var prop in this.template ) {
					if ( prop === this.data.type ) {
						return this.template[prop]
					}
				}
			}
		} else {
			return this.template;
		}
	},

	createChildren: function() {
		// console.log('createChildren', this);
		for (var i = 0; i < this.data.children.length; i++) {
			if (typeof this.childType === 'object') {
				var Constructor = this.getChildByType(this.data.children[i]);

				var child = new Constructor({
					id: this.id + 'c' + i,
					data: this.data.children[i],
					parent: this
				});
			} else {
				var child = new this.childType({
					id: this.id + 'c' + i,
					data: this.data.children[i],
					parent: this,
				});
			}

			this.addChild( child );
		}
	},

	destroyChildren: function() {
		if (this.children.length) {

			$.each(this.children, function(index, child) {
				// console.log('destroyChildren:', child);
				child.deinitialize();
			});

			this.children = [];
		}
	},

	addChild: function(child) {
		if (this.childContainer) {
			this.$el.find( this.childContainer ).first().append( child.$el );
		} else {
			this.$el.append( child.$el );
		}

		this.children.push( child );
	},

	startUpdate: function( payload ) {
		// fire our assigned lifecycle methods in a queue, blocking the process if any return false
		var self = this;
		if (self._lifecycle.length <= 0) {
			return;
		}

		var continueCycle;
		(function chain(i) {

			if (i >= self._lifecycle.length || typeof self[self._lifecycle[i]] !== 'function') {
				return;
			}

			self._lifecycleTimeout = setTimeout(function() {
				continueCycle = self[self._lifecycle[i]](payload);
				if (!continueCycle) {
					return;
				}
				chain(i + 1);
			}, 0);

		})(0);
	},

	beforeUpdate: function() {
		return true;
	},
	onUpdate: function() {
		return true;
	},
	afterUpdate: function() {

	}
}

_.extend(Component.prototype, proto);

Component.extend = extend;

module.exports = Component;


},{"./extend":7}],2:[function(require,module,exports){
var extend = require('./extend');
var Events = require('./Events');

var Dispatcher = function(options) {
	if (options && options.actions) {
		if (typeof options.actions === 'string') {
			this.createAction(options.actions);
		} else {
			this.createActions(options.actions);
		}
	}

	Object.defineProperty(this, '_actions', {
		enumerable: false,
		value: {}
	});

	_.extend(this._actions, Events);

	this.initialize.apply(this, arguments);
};

Dispatcher.prototype = {
	initialize: function() {},

	_prepareAction: function(name, callbacks) {
		var action = {};
		if (_.isString(name)) {
			action.name = name;
			if (callbacks) {
				if (_.isFunction(callbacks)) {
					action.beforeEmit = callbacks;
				} else {
					for (var c in callbacks) {
						if (callbacks.hasOwnProperty(c)) {
							action[c] = callbacks[c];
						}
					}
				}
			}
		} else {
			action = name;
		}
		return action;
	},

	createAction: function(name, callbacks) {
		var action = this._prepareAction(name, callbacks);
		var dispatch;
		var emit = function(payload) {
			this._triggerAction(action.name, payload);
		}.bind(this);
		var beforeEmit = function(payload) {
			action.beforeEmit(payload, function(newPayload) {
				emit(newPayload);
			});
		};
		var shouldEmit = function(fn) {
			return function(payload) {
				if (action.shouldEmit(payload)) {
					fn(payload);
				}
			};
		};
		if (action.shouldEmit) {
			if (action.beforeEmit) {
				dispatch = shouldEmit(beforeEmit);
			} else {
				dispatch = shouldEmit(emit);
			}
		} else if (action.beforeEmit) {
			dispatch = beforeEmit;
		} else {
			dispatch = emit;
		}
		Object.defineProperty(this, action.name, {
			enumerable: false,
			value: dispatch
		});
	},

	createActions: function(actions) {
		var action;
		for (action in actions) {
			if (actions.hasOwnProperty(action)) {
				this.createAction(actions[action]);
			}
		}
	},

	register: function(action, listener, method) {
		if (!listener) {
			throw new Error('The listener is undefined!');
		}
		method = (typeof(method) === 'function') ? method : listener[method || action];
		if (typeof(method) !== 'function') {
			throw new Error('Cannot register callback `' + method +
				'` for the action `' + action +
				'`: the method is undefined on the provided listener object!');
		}
		this._actions.on(action, method.bind(listener));
	},

	registerStore: function(actions, listener, methods) {
		var isUniqueCallback = (typeof methods) === 'string' || (typeof methods) === 'function';
		var actionsNames;
		if (_.isArray(actions)) {
			methods = methods || actions;
			if (!isUniqueCallback && actions.length !== methods.length) {
				throw new RangeError('The # of callbacks differs from the # of action names!');
			}
		} else if (_.isObject(actions)) {
			actionsNames = Object.keys(actions);
			methods = actionsNames.map(function(actionName) {
				return actions[actionName];
			});
			actions = actionsNames;
		}
		for (var i = 0, action;
			(action = actions[i]); i++) {
			this.register(action, listener, isUniqueCallback ? methods : methods[i]);
		}
	},

	dispatch: function(actionName, payload) {
		if (this.hasOwnProperty(actionName)) {
			return this[actionName](payload);
		}
		throw new Error('There is not an action called `' + actionName + '`');
	},

	_triggerAction: function(actionName, payload) {
		this._actions.trigger(actionName, payload);
	}
};

Dispatcher.extend = extend;

module.exports = Dispatcher;
},{"./Events":3,"./extend":7}],3:[function(require,module,exports){
// Events, stolen from Backbone

// Ulna.Events
// ---------------
// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, Ulna.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//

var Events = {};
// Regular expression used to split event strings.
var eventSplitter = /\s+/;

// Iterates over the standard `event, callback` (as well as the fancy multiple
// space-separated events `"change blur", callback` and jQuery-style event
// maps `{event: callback}`), reducing them by manipulating `memo`.
// Passes a normalized single event name and callback, as well as any
// optional `opts`.
var eventsApi = function(iteratee, memo, name, callback, opts) {
	var i = 0,
		names;
	if (name && typeof name === 'object') {
		// Handle event maps.
		if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
		for (names = _.keys(name); i < names.length; i++) {
			memo = iteratee(memo, names[i], name[names[i]], opts);
		}
	} else if (name && eventSplitter.test(name)) {
		// Handle space separated event names.
		for (names = name.split(eventSplitter); i < names.length; i++) {
			memo = iteratee(memo, names[i], callback, opts);
		}
	} else {
		memo = iteratee(memo, name, callback, opts);
	}
	return memo;
};

// Bind an event to a `callback` function. Passing `"all"` will bind
// the callback to all events fired.
Events.on = function(name, callback, context) {
	return internalOn(this, name, callback, context);
};

// An internal use `on` function, used to guard the `listening` argument from
// the public API.
var internalOn = function(obj, name, callback, context, listening) {
	obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
		context: context,
		ctx: obj,
		listening: listening
	});

	if (listening) {
		var listeners = obj._listeners || (obj._listeners = {});
		listeners[listening.id] = listening;
	}

	return obj;
};

// Inversion-of-control versions of `on`. Tell *this* object to listen to
// an event in another object... keeping track of what it's listening to.
Events.listenTo = function(obj, name, callback) {
	if (!obj) return this;
	var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
	var listeningTo = this._listeningTo || (this._listeningTo = {});
	var listening = listeningTo[id];

	// This object is not listening to any other events on `obj` yet.
	// Setup the necessary references to track the listening callbacks.
	if (!listening) {
		var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
		listening = listeningTo[id] = {
			obj: obj,
			objId: id,
			id: thisId,
			listeningTo: listeningTo,
			count: 0
		};
	}

	// Bind callbacks on obj, and keep track of them on listening.
	internalOn(obj, name, callback, this, listening);
	return this;
};

// The reducing API that adds a callback to the `events` object.
var onApi = function(events, name, callback, options) {
	if (callback) {
		var handlers = events[name] || (events[name] = []);
		var context = options.context,
			ctx = options.ctx,
			listening = options.listening;
		if (listening) listening.count++;

		handlers.push({
			callback: callback,
			context: context,
			ctx: context || ctx,
			listening: listening
		});
	}
	return events;
};

// Remove one or many callbacks. If `context` is null, removes all
// callbacks with that function. If `callback` is null, removes all
// callbacks for the event. If `name` is null, removes all bound
// callbacks for all events.
Events.off = function(name, callback, context) {
	if (!this._events) return this;
	this._events = eventsApi(offApi, this._events, name, callback, {
		context: context,
		listeners: this._listeners
	});
	return this;
};

// Tell this object to stop listening to either specific events ... or
// to every object it's currently listening to.
Events.stopListening = function(obj, name, callback) {
	var listeningTo = this._listeningTo;
	if (!listeningTo) return this;

	var ids = obj ? [obj._listenId] : _.keys(listeningTo);

	for (var i = 0; i < ids.length; i++) {
		var listening = listeningTo[ids[i]];

		// If listening doesn't exist, this object is not currently
		// listening to obj. Break out early.
		if (!listening) break;

		listening.obj.off(name, callback, this);
	}
	if (_.isEmpty(listeningTo)) this._listeningTo = void 0;

	return this;
};

// The reducing API that removes a callback from the `events` object.
var offApi = function(events, name, callback, options) {
	// No events to consider.
	if (!events) return;

	var i = 0,
		listening;
	var context = options.context,
		listeners = options.listeners;

	// Delete all events listeners and "drop" events.
	if (!name && !callback && !context) {
		var ids = _.keys(listeners);
		for (; i < ids.length; i++) {
			listening = listeners[ids[i]];
			delete listeners[listening.id];
			delete listening.listeningTo[listening.objId];
		}
		return;
	}

	var names = name ? [name] : _.keys(events);
	for (; i < names.length; i++) {
		name = names[i];
		var handlers = events[name];

		// Bail out if there are no events stored.
		if (!handlers) break;

		// Replace events if there are any remaining.  Otherwise, clean up.
		var remaining = [];
		for (var j = 0; j < handlers.length; j++) {
			var handler = handlers[j];
			if (
				callback && callback !== handler.callback &&
				callback !== handler.callback._callback ||
				context && context !== handler.context
			) {
				remaining.push(handler);
			} else {
				listening = handler.listening;
				if (listening && --listening.count === 0) {
					delete listeners[listening.id];
					delete listening.listeningTo[listening.objId];
				}
			}
		}

		// Update tail event if the list has any events.  Otherwise, clean up.
		if (remaining.length) {
			events[name] = remaining;
		} else {
			delete events[name];
		}
	}
	if (_.size(events)) return events;
};

// Bind an event to only be triggered a single time. After the first time
// the callback is invoked, it will be removed. When multiple events are
// passed in using the space-separated syntax, the event will fire once for every
// event you passed in, not once for a combination of all events
Events.once = function(name, callback, context) {
	// Map the event into a `{event: once}` object.
	var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
	return this.on(events, void 0, context);
};

// Inversion-of-control versions of `once`.
Events.listenToOnce = function(obj, name, callback) {
	// Map the event into a `{event: once}` object.
	var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
	return this.listenTo(obj, events);
};

// Reduces the event callbacks into a map of `{event: onceWrapper}`.
// `offer` unbinds the `onceWrapper` after it has been called.
var onceMap = function(map, name, callback, offer) {
	if (callback) {
		var once = map[name] = _.once(function() {
			offer(name, once);
			callback.apply(this, arguments);
		});
		once._callback = callback;
	}
	return map;
};

// Trigger one or many events, firing all bound callbacks. Callbacks are
// passed the same arguments as `trigger` is, apart from the event name
// (unless you're listening on `"all"`, which will cause your callback to
// receive the true name of the event as the first argument).
Events.trigger = function(name) {
	if (!this._events) return this;

	var length = Math.max(0, arguments.length - 1);
	var args = Array(length);
	for (var i = 0; i < length; i++) args[i] = arguments[i + 1];

	eventsApi(triggerApi, this._events, name, void 0, args);
	return this;
};

// Handles triggering the appropriate event callbacks.
var triggerApi = function(objEvents, name, cb, args) {
	if (objEvents) {
		var events = objEvents[name];
		var allEvents = objEvents.all;
		if (events && allEvents) allEvents = allEvents.slice();
		if (events) triggerEvents(events, args);
		if (allEvents) triggerEvents(allEvents, [name].concat(args));
	}
	return objEvents;
};

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
var triggerEvents = function(events, args) {
	var ev, i = -1,
		l = events.length,
		a1 = args[0],
		a2 = args[1],
		a3 = args[2];
	switch (args.length) {
		case 0:
			while (++i < l)(ev = events[i]).callback.call(ev.ctx);
			return;
		case 1:
			while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1);
			return;
		case 2:
			while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2);
			return;
		case 3:
			while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
			return;
		default:
			while (++i < l)(ev = events[i]).callback.apply(ev.ctx, args);
			return;
	}
};

// Aliases for backwards compatibility.
Events.bind = Events.on;
Events.unbind = Events.off;

module.exports = Events;
},{}],4:[function(require,module,exports){
var extend = require('./extend');
var Events = require('./Events');

// ROUTER
var Router = function(obj) {
	this.state = {}; // current state (before set on model, posted to server)
	for (var prop in obj) {
		this[prop] = obj[prop];
	}

	this.initialize.apply(this, arguments);
};

_.extend(Router.prototype, Events, {
	initialize: function() {
		this.setState(this.state);
		this.registerWithDispatcher();
		this.on('routerUpdate', this.update, this);
		this.bindEvents();
	},

	deinitialize: function() {
		this.off('routerUpdate', this.update, this);
		// this.unregisterWithDispatcher();	// is a function like this needed?
	},

	bindEvents: function() {
		var regex = /^(\w+)/;
		for (var prop in this.events) {
			var eventString = regex.exec(prop)[0];
			// presume only window events
			window.addEventListener(eventString, _.bind(this[this.events[prop]], this));
		}
	},

	unbindEvents: function() {
		var regex = /^(\w+)/;
		for (var prop in this.events) {
			var eventString = regex.exec(prop)[0];
			// presume only window events
			window.removeEventListener(eventString, _.bind(this[this.events[prop]], this));
		}
	},

	registerWithDispatcher: function() {
		// overrule in the constructor
	},

	getState: function(string) {
		if (this.state.hasOwnProperty(string)) {
			return this.state[string];
		}
	},

	setState: function(state) {
		for (var item in state) {
			if (this.state.hasOwnProperty(item)) {
				this.state[item] = state[item];
				this.trigger('routerUpdate');
			} else {
				return false;
			}
		}
	},

	getCurrentState: function(state) {
		var clonedState = _.clone(this.state);
		return clonedState;
	},

	updateHistory: function( obj ) {
		if (!obj.hasOwnProperty('title') || !obj.hasOwnProperty('name')) {
			console.log('Warning: router must be supplied a name and title property to update history');
		}

		document.title = obj.title;
		// update the history
		history.pushState(obj, obj.name, obj.name);
	},

	update: function() {

	}
});

Router.extend = extend;

module.exports = Router;
},{"./Events":3,"./extend":7}],5:[function(require,module,exports){
var extend = require('./extend');
var Events = require('./Events');

// STORE
// Store is your "model" or data layer. A store represents, and maintains, a discrete
// piece of application or UI data. Todo: use props as static data from the server, only
// updated when about to be POSTed back to the server.
// State is solely data for the UI component's consumption (i.e. a "view model")

var Store = function(obj) {
	this._lifecycle = ['beforeUpdate', 'onUpdate', 'afterUpdate'];
	this._lifecycleTimeout = true;
	
	// imagine the store as a model/state universe that intakes data
	// from the server, constructs an updated view data obj, and then sets it on the view
	this.model = {};
	this.props = {}; // the response from the server (parsed), in other words static data
	this.state = {}; // current state (before set on model, posted to server)
	
	for (var prop in obj) {
		this[prop] = obj[prop];
	}
	
	this.initialize.apply(this, arguments);
};

/*
	initialize,				// all preliminary setup
	deinitialize,			// deconstruction, unbinding events, etc

	bindInternals, 			// convenience function for binding internal events (and events the component listens to)
	registerWithDispatcher, 	// all dispatcher registrations (blank by default)

	compareIdsByLevel, 		// takes two concatenated cids and checks if they match to a certain level, informing us if the two are related.
								// this is particularly useful in event handlers when listening to blanket dispatcher events.
								// use this function when you want to block a store's process because the dispatcher's message was irrelevant based
								// on the component parent-child hierarchy

	getCurrentState,				// needs work, should provide a copied object of this store's state
	getCurrentProps,				// needs work, should provide a copied object of this store's props

	setState,				// takes an incoming object, sets state properties based on that object. if successful, fires off an event
	setProps,				// takes an incoming object, sets state properties based on that object. if successful, fires off an event

	shouldComponentUpdate,	// takes the current state (props?) and a mutated version of the same object, compares the two, and if they are different, fires an event
	startLifecycle,			// kicks off the store's update process, firing the specified functions in a queue

	startUpdate,			// update process part 1
	onUpdate,				// update process part 2 (most often used)
	afterUpdate			// any post-update processes
	
*/

_.extend(Store.prototype, Events, {
	initialize: function() {
		this.id = _.uniqueId('s');
		this.setProps(this.model);

		// initial state from constructor args
		this.setState(this.state);
		this.bindInternals();
		this.registerWithDispatcher();
	},

	deinitialize: function() {
		this.unbindInternals();
		// this.unregisterWithDispatcher(); 	// is a function like this needed?
	},

	bindInternals: function() {
		// this.on('setState', this.setState, this);
		this.on('startUpdate', this.startUpdate, this);
		this.on('shouldComponentUpdate', this.shouldComponentUpdate, this);
	},

	unbindInternals: function() {
		// this.on('setState', this.setState, this);
		this.off('startUpdate', this.startUpdate, this);
		this.off('shouldComponentUpdate', this.shouldComponentUpdate, this);
	},

	registerWithDispatcher: function() {
		// overrule in your constructor
	},

	compareIdsByLevel: function(integer, compareId, comparatorId) {
		// take two ids and compare them to see if they match up to a certain limit,
		// starting from the beginning.
		// the integer specifies how many levels we are checking down in the component hierarchy
		// starting from the topmost cid
		// in an event handler, the compareCid is the incoming cid, while the comparatorCid
		// is the id to check against, usually this.cid or this.parent.cid
		// basically the first id should be the same length or longer than the second
		var compareIdArr = compareId.split('c');
		compareIdArr.shift();

		var comparatorIdArr = comparatorId.split('c');
		comparatorIdArr.shift();

		for (var i = 0; i < integer; i++) {
			if (compareIdArr[i] !== comparatorIdArr[i]) {
				return false;
			}
		}
		return true;
	},

	getState: function(string) {
		if (this.state.hasOwnProperty(string)) {
			return this.state[string];
		}
	},

	setProps: function(obj) {
		for (var prop in obj) {
			if (this.model.hasOwnProperty(prop)) {
				this.props[prop] = obj[prop];
			}
		}

		this.trigger('propsSet', this.cid);
	},

	setState: function(state) {
		for (var item in state) {
			if (this.state.hasOwnProperty(item)) {
				this.state[item] = state[item];
				this.trigger('shouldComponentUpdate');
			} else {
				return false;
			}
		}
	},

	getCurrentState: function(state) {
		var clonedState = _.clone(this.state);
		return clonedState;
	},

	getCurrentProps: function() {
		return $.extend(true, {}, this.props);
	},

	shouldComponentUpdate: function(nextState) {
		if (_.isEqual(nextState, this.state)) {
			return false;
		} else {
			this.setState(nextState);
			this.trigger('componentUpdate');
			return true;
		}
	},

	startUpdate: function() {
		var payload = arguments;
		var self = this;

		if (self._lifecycle.length <= 0) {
			return;
		}

		var continueCycle;
		(function chain(i) {

			if (i >= self._lifecycle.length || typeof self[self._lifecycle[i]] !== 'function') {
				return;
			}

			self._lifecycleTimeout = setTimeout(function() {
				continueCycle = self[self._lifecycle[i]](payload);
				if (!continueCycle) {
					return;
				}
				chain(i + 1);
			}, 0);

		})(0);
	},

	beforeUpdate: function() {
		// define your custom method
		// ensure this target obj based on the desired id
		// if not, return false
		return true;
	},

	onUpdate: function() {
		// define your custom method
		// clone current state
		// construct new state object
		// shouldComponentUpdate( prevState, nextState )
		return true;
	},

	afterUpdate: function() {
		// make dispatcher calls if necessary, etc
	}
});

Store.extend = extend;

module.exports = Store;


},{"./Events":3,"./extend":7}],6:[function(require,module,exports){
var Events = require('./Events');
var extend = require('./extend');
var Component = require('./Component');
var Store = require('./Store');
var Dispatcher = require('./Dispatcher');
var Router = require('./Router');

// Ulna - the midnight framework
// A Backbone-style implementation of concepts borrowed from ReactJS and Flux.

// ** your tools should work for you, not the other way around **

// CORE
// create a singleton object to collect all our pieces,
// then expose that in the browser

var Ulna = {};

// Allow the `Ulna` object to serve as a global event bus for folks who
// want global "pubsub" in a convenient place.
_.extend(Ulna, Events);

// we'll set underscore's template settings by default
// this can be overruled in Ulna.templateSettings
/*
	{{ interpolate }}
	-- escape --
	<< evaluate >>
*/
_.templateSettings = {
	interpolate: /\{\{(.+?)\}\}/g,
	escape: /\-\-(.+?)\-\-/g,
	evaluate: /\<\<(.+?)\>\>/g
}

Ulna.templateSettings = _.templateSettings;

Ulna.extend = extend;
Ulna.Events = Events;
Ulna.Component = Component;
Ulna.Store = Store;
Ulna.Dispatcher = Dispatcher;
Ulna.Router = Router;

if (window) {
	window.Ulna = Ulna;
}

module.exports = Ulna;
},{"./Component":1,"./Dispatcher":2,"./Events":3,"./Router":4,"./Store":5,"./extend":7}],7:[function(require,module,exports){
// EXTEND
// subclassing function stolen from backbone

var extend = function ( protoProps, staticProps ) {
	var parent = this;
	var child;
	
	if ( protoProps && _.has( protoProps, 'constructor' ) ) {
		child = protoProps.constructor;
	} else {
		child = function () {
			return parent.apply( this, arguments );
		};
	}

	_.extend( child, parent, staticProps );

	var Surrogate = function () {
		this.constructor = child;
	};

	Surrogate.prototype = parent.prototype;
	child.prototype = new Surrogate();

	if ( protoProps ) {
		_.extend( child.prototype, protoProps );
	}

	child.__super__ = parent.prototype;

	return child;
};

module.exports = extend;

},{}]},{},[7,3,1,5,2,4,6]);
