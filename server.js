// REQUIRES, SERVER
var Hapi = require("hapi");
var Joi = require('joi');

var server = new Hapi.Server(8080, "localhost", {
	views: {
		engines: {
			jade: require('jade'),
		},
		path: './views',
		isCached: false
	}
});

server.start(function() {
    console.log("Hapi server started @", server.info.uri);
});

// METHODS

// ROUTES
server.route({
	path: '/',
	method: 'GET',
	handler: function(request, reply) {
		reply.view('index');
	}
});

server.route({
	path: '/test',
	method: 'GET',
	handler: function(request, reply) {
		reply('test');
	}
});

server.route({
	path: '/css/{path*}',
	method: 'GET',
	handler: {
		directory: {
			path: './public/css',
			listing: false,
			index: false
		}
	}
});

server.route({
	path: '/js/{path*}',
	method: 'GET',
	handler: {
		directory: {
			path: './public/js',
			listing: false,
			index: false
		}
	}
});