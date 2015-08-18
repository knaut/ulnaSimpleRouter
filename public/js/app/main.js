define([
	'jquery', 
	'backbone', 
	'marionette', 
	'underscore', 
	'foundation', 
	'ulna'
 ], function ($, Backbone, Marionette, _, Foundation, Ulna) {
        _.templateSettings = {
			interpolate: /\{\{(.+?)\}\}/g,
			escape: /\-\-(.+?)\-\-/g,
			evaluate: /\<\<(.+?)\>\>/g
		}

		var Dispatch = new Ulna.Dispatcher({
			actions: [
				'update_route',
				'quote_close',
				'child_click',
				'pop_state'
			]
		})

		var Router = Ulna.Router.extend({
			events: {
				'popstate': 'handlePopState'
			},
			routes: {
				'home': 'handleHome',
				'jack': 'handleJack',
				'tyler': 'handleTyler',
				'marla': 'handleMarla'
			},
			registerWithDispatcher: function() {
				// Dispatch.register('update_route', this, 'handleUpdateRoute');
				Dispatch.register('child_click', this, 'handleByRoute');
				Dispatch.register('quote_close', this, 'handleByRoute');
			},
			handleByRoute: function() {
				// console.log('router handleByRoute', arguments[0]);
				for (var route in this.routes) {
					if (arguments[0].hasOwnProperty('name') && arguments[0].name === route) {
						// console.log('update with ' + route);
						this[ this.routes[route] ]( arguments[0].id );
					}
				}
			},
			handleHome: function( id ) {
				// console.log('handleHome', id);

				this.updateHistory({
					id: id,
					title: 'home',
					name: '/'
				});
			},
			handleJack: function( id ) {
				// console.log('handleJack', id);

				this.updateHistory({
					id: id,
					title: 'jack',
					name: 'jack'
				});
			},
			handleTyler: function( id ) {
				// console.log('handleTyler', id);

				this.updateHistory({
					id: id,
					title: 'tyler',
					name: 'tyler'
				});
			},
			handleMarla: function( id ) {
				// console.log('handleMarla', id);

				this.updateHistory({
					id: id,
					title: 'marla',
					name: 'marla'
				});
			},
			handlePopState: function(e) {
				// do everything that relates to the back/forward buttons here
				var state = e.state;
				
				if (e.state === null || !e.state) {
					var payload = {
						title: 'home',
						name: '/'
					}
				} else {
					var payload = state;
				}

				console.log('handlePopState', payload)

				Dispatch.dispatch('pop_state', payload);
			}
		});

		// quotes are grandchildren, or third-level descendants of App, direct descendants of ChildComponent
		var Quote = Ulna.Component.extend({
			template: '<div class="quote"><span>{{quote}}</span></div>',
			events: {
				'click span': 'handleQuoteClose'
			},
			handleQuoteClose: function() {
				Dispatch.dispatch('quote_close', {
					id: this.id,
					name: 'home'
				});
			}
		});

		var ChildStore = Ulna.Store.extend({
			registerWithDispatcher: function() {
				Dispatch.register('child_click', this, 'handleChildClick');
				Dispatch.register('quote_close', this, 'handleQuoteClose');
				Dispatch.register('pop_state', this, 'handlePopState');
			},
			handleChildClick: function() {
				var payload = arguments[0];

				if (payload.id === this.parent.id) {
					this.trigger('startUpdate', {
						active: payload.name
					});
				}
			},
			handleQuoteClose: function() {
				var payload = arguments[0];
				console.log('childStore handleQuoteClose', payload)

				this.trigger('startUpdate', {
					active: null
				});
			},
			handlePopState: function() {
				console.log('child store popstate', arguments[0], this.parent.id);

				console.log(arguments[0].title)
				if ( arguments[0].title === 'home' ) {
					console.log('blerg')
					this.handleQuoteClose();
					return false;
				}

				if ( arguments[0].id !== this.parent.id ) {
					return false;
				}



				this.trigger('startUpdate', {
					active: arguments[0].title
				});
			},
			onUpdate: function() {
				var payload = arguments[0];
				payload = payload[0];
				
				this.setState({
					active: payload.active
				});
			}
		});

		var ChildComponent = Ulna.Component.extend({
			childType: Quote,
			events: {
				'click .trigger': 'handleChildClick'
			},
			setStore: function() {
				this.store = new ChildStore({
					parent: this,
					state: {
						active: false
					}
				});
			},
			handleChildClick: function() {
				Dispatch.dispatch('child_click', {
					id: this.id,
					name: this.data.name
				});
			},
			onUpdate: function() {
				var state = this.store.getCurrentState();

				if (state.active) {
					this.$el.find('.quote').addClass('active');
				} else {
					this.$el.find('.quote').removeClass('active');
				}
			}
		});

		var JackChild = ChildComponent.extend({
			template: '<div id="jack" class="child"><span class="trigger">{{name}}</span></div>'
		});

		var TylerChild = ChildComponent.extend({
			template: '<div id="tyler" class="child"><span class="trigger">{{name}}</span></div>'
		});

		var MarlaChild = ChildComponent.extend({
			template: '<div id="marla" class="child"><span class="trigger">{{name}}</span></div>'
		});

		var AppStore = Ulna.Store.extend({
			registerWithDispatcher: function() {
				Dispatch.register( 'child_click', this, 'handleChildClick' );
				Dispatch.register( 'quote_close', this, 'handleQuoteClose' );
				Dispatch.register( 'pop_state', this, 'handlePopState' );
			},
			handleChildClick: function() {
				var payload = arguments[0];

				this.trigger('startUpdate', {
					child: payload.name
				});
			},
			handleQuoteClose: function() {
				var payload = arguments[0];

				this.trigger('startUpdate', {
					child: null
				});
			},
			handleUpdateRoute: function() {
				// console.log('handle any update route:', arguments);
				var payload = arguments[0];
				// console.log('payload', payload);
				
				this.trigger('startUpdate', {
					child: payload.name
				});
			},
			handlePopState: function() {
				this.trigger('startUpdate', {
					child: arguments[0].title
				});
			},
			onUpdate: function() {
				var payload = arguments[0];
				payload = payload[0];

				this.setState({
					child: payload.child
				});

				return true;
			}
		});

		var App = Ulna.Component.extend({
			setStore: function() {
				this.store = new AppStore({
					parent: this,
					state: {
						child: null
					}
				});
			},
			onUpdate: function() {
				var state = this.store.getCurrentState();

				// console.log('App update', state);

			}
		});
		
		app = new App({
			$el: '#app-root',

			template: '<div id="app-container"></div>',

			childContainer: '#app-container',
			
			childType: {
				jack: JackChild,
				tyler: TylerChild,
				marla: MarlaChild
			},
			
			router: new Router,

			data: {
				name: 'Ulna Simple Router Testing',
				children: [
					{
						name: 'jack',
						children: [
							{
								name: 'quote',
								quote: 'I am Jack\'s complete lack of surprise.'
							}
						]
						
					},
					{
						name: 'tyler',
						children: [
							{
								name: 'quote',
								quote: 'I want you to hit me as hard as you can.'
							}
						]
					},
					{
						name: 'marla',
						children: [
							{
								name: 'quote',
								quote: 'Have you ever heard a death rattle before?'
							}
						]
					}
				]
			}
		});

		return app;
    }
);