var _ = require('underscore');
var $ = require('../../head.js');
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
		// this.$el.fadeIn(); 
		this.$el.css({
			visibility: 'visible'
		});
	},

	unrender: function() {
		// place to do fadeout animations
		// this may need a queue to do things properly
		// this.$el.fadeOut();
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

				// this.$el.find(reg.exec(prop)[0]).on(eventString, _.bind(this[this.events[prop]], this));
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

				// this.$el.find(reg.exec(prop)[0]).off(eventString, _.bind(this[this.events[prop]], this));
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

