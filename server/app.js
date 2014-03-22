/**
 * Created by ndaza on 12/03/14.
 */

var express = require('express');
var app = express();
var HTTP = require('http');
var IO = require('socket.io');
var Path = require('path');

var _ = require('underscore')._; // npm install underscore
var Backbone = require('backbone'); // npm install backbone
var BackboneRelational = require('backbone-relational'); // npm install backbone

var server = HTTP.createServer( app, function( request, response ) {
	response.writeHead(200, {"Content-Type" : "application/json"});
	response.end('{"status" : "running"}');
}).listen(8080);

var socket = IO.listen( server );
var users = {};
var rooms = {};

console.debug = console.debug || console.info;
console.model = console.model || console.debug;
console.view = console.view || console.debug;
console.app = console.app || console.debug;
console.groupEnd = console.groupEnd || console.debug;

app.console = console;
app.class = {
	name: 'Server',
	package: 'app.server',
	type: 'Express'
};

app.views = require( Path.resolve( __dirname + "/../js/views.js" ) );
app.models = require( Path.resolve( __dirname + "/../js/models.js" ) );

global._ = _;
global.Backbone = Backbone;

app.views.initialize( app );
app.views.load();
app.models.initialize( app );
app.models.load();


var userSystem = new app.models.User({
	id: 1,
	na: 'System',
	im: '',
	gm: -5
});

rooms = {
	1: new app.models.Room({
		id: 1,
		na: 'Default',
		ow: userSystem,
		de: 'Default system chat room.',
		us: [],
		ti: new Date()
	}),
	2: new app.models.Room({
		id: 2,
		na: 'Fiends',
		ow: userSystem,
		de: 'Default friends system chat room.',
		us: [],
		ti: new Date()
	})
};

socket.set('log level', 2);

socket.on('connection', function ( client ) {
	console.log( "Conectado." );

	client.emit("roomslist", rooms);

});
