define([
	'jquery', 
	'underscore',
	'ulna'
 ], function ($, _, Ulna) {

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
				Dispatch.register('child_click', this, 'handleByRoute');
				Dispatch.register('quote_close', this, 'handleByRoute');
			},
			handleByRoute: function() {
				// loop through our routes and call the associated method
				for (var route in this.routes) {
					if (arguments[0].hasOwnProperty('name') && arguments[0].name === route) {
						this[ this.routes[route] ]( arguments[0].id );
					}
				}
			},
			handleHome: function( id ) {
				this.updateHistory({
					id: id,
					title: 'home',
					name: '/'
				});
			},
			handleJack: function( id ) {
				this.updateHistory({
					id: id,
					title: 'jack',
					name: 'jack'
				});
			},
			handleTyler: function( id ) {
				this.updateHistory({
					id: id,
					title: 'tyler',
					name: 'tyler'
				});
			},
			handleMarla: function( id ) {
				this.updateHistory({
					id: id,
					title: 'marla',
					name: 'marla'
				});
			},
			handlePopState: function(e) {
				// do everything that relates to the back/forward buttons here
				var state = e.state;
				console.log(state)
				
				if (e.state === null || !e.state) {
					var payload = {
						title: 'home',
						name: '/'
					}
				} else {
					var payload = state;
				}

				Dispatch.dispatch('pop_state', payload);
				document.title = payload.title;
			}
		});

		// quotes are grandchildren, or third-level descendants of App, direct descendants of ChildComponent
		// they're static for now
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

				this.trigger('startUpdate', {
					active: null
				});
			},
			handlePopState: function() {
				// closing the quote is the equivalent of going back to home
				if ( arguments[0].title === 'home' ) {
					// instead of dispatching again, we'll call our equivalent event handler, for brevity
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
		
		// direct descendents of the top-level component
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

		// we'll extend the component again to prove we can render multiple childTypes
		var JackChild = ChildComponent.extend({
			template: '<div id="jack" class="child"><span class="trigger">{{name}}</span></div>'
		});

		var TylerChild = ChildComponent.extend({
			template: '<div id="tyler" class="child"><span class="trigger">{{name}}</span></div>'
		});

		var MarlaChild = ChildComponent.extend({
			template: '<div id="marla" class="child"><span class="trigger">{{name}}</span></div>'
		});
		
		// we use static data since this is a simple router/history manipulation demo
		// for now, app doesn't need a store
		app = new Ulna.Component({
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