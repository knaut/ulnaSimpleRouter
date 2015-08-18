require.config({
	baseUrl: 'js',
	paths: {
		backbone: 'libs/backbone',
		marionette: 'libs/backbone.marionette',
		ulna: 'libs/ulna',
		requirejs: 'libs/require',
		underscore: 'libs/underscore',
		jquery: 'libs/jquery',
		'jquery.cookie': 'libs/jquery.cookie',
		foundation: 'libs/foundation',
		'foundation.abide': 'libs/foundation.abide',
		'foundation.accordion': 'libs/foundation.accordion',
		'foundation.alert': 'libs/foundation.alert',
		'foundation.clearing': 'libs/foundation.clearing',
		'foundation.dropdown': 'libs/foundation.dropdown',
		'foundation.equalizer': 'libs/foundation.equalizer',
		'foundation.interchange': 'libs/foundation.interchange',
		'foundation.joyride': 'libs/foundation.joyride',
		'foundation.magellan': 'libs/foundation.magellan',
		'foundation.offcanvas': 'libs/foundation.offcanvas',
		'foundation.orbit': 'libs/foundation.orbit',
		'foundation.reveal': 'libs/foundation.reveal',
		'foundation.slider': 'libs/foundation.slider',
		'foundation.tab': 'libs/foundation.tab',
		'foundation.toolbar': 'libs/foundation.toolbar',
		'foundation.topbar': 'libs/foundation.topbar'
	},
	shim: {
		backbone: {
			deps: [
				'underscore',
				'jquery'
			],
			exports: 'Backbone'
		},
		marionette: {
			deps: [
				'underscore',
				'backbone',
				'jquery'
			],
			exports: 'Marionette'
		},
		ulna: {
			deps: [
				'underscore',
				'jquery'
			],
			exports: 'Ulna'
		},
		'backbone.validateAll': [
			'backbone'
		],
		'jquery.cookie': [
			'jquery'
		],
		foundation: {
			deps: [
				'jquery'
			],
			exports: 'Foundation'
		},
		'foundation.abide': [
			'foundation'
		],
		'foundation.accordion': [
			'foundation'
		],
		'foundation.alert': [
			'foundation'
		],
		'foundation.clearing': [
			'foundation'
		],
		'foundation.dropdown': [
			'foundation'
		],
		'foundation.equalizer': [
			'foundation'
		],
		'foundation.interchange': [
			'foundation'
		],
		'foundation.joyride': [
			'foundation',
			'jquery.cookie'
		],
		'foundation.magellan': [
			'foundation'
		],
		'foundation.offcanvas': [
			'foundation'
		],
		'foundation.orbit': [
			'foundation'
		],
		'foundation.reveal': [
			'foundation'
		],
		'foundation.slider': [
			'foundation'
		],
		'foundation.tab': [
			'foundation'
		],
		'foundation.toolbar': [
			'foundation'
		],
		'foundation.topbar': [
			'foundation'
		]
	},
	packages: [

	]
});