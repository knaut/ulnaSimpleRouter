var _ = require('underscore');
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

_.extend(Store.prototype, Events, {
	initialize: function() {
		this.id = this.parent.id + _.uniqueId('s');
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

