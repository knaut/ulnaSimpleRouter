var _ = require('underscore');
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