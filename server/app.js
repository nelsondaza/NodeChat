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

console.debug = console.debug || console.info || console.log;
console.model = console.model || console.debug;
console.model = function(){};
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
	gm: -5,
	cl: null,
	ro: null
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
	console.log( "Conectado: " + client.id );
	client.emit("roomslist", rooms);

	if( client.id && users[client.id] ) {
		// Never happens?!
		console.log( "Already in..." );
	}

	client.on("join", function( name, roomId ) {
		console.log( "Joining: " + name + " in " + roomId );

		var user = {};
		if( users[client.id] ) {
			user = users[client.id];
		}
		else {
			user = new app.models.User({
				id: client.id,
				na: name,
				im: '',
				gm: -5,
				cl: client.id,
				ro: roomId
			});

			client.name = name;
		}

		if( !rooms[roomId] ) {
			console.log( "Login ERROR: " + name + " in " + roomId );
			client.emit('login', 'ERROR', 'You can\'t connect to this room.' );
		}
		else {
			users[client.id] = user;

			// store the roomId in the socket session for this client
			client.room = roomId;
			user.ro = roomId;

			// send client to room
			client.join( roomId );
			rooms[roomId].set('us',user, 'add');

			// echo to client they've connected
			client.emit('login', 'OK', 'You have connected to ' + rooms[roomId].get('na'), roomId );
			console.log( "Login OK: " + name + " in " + roomId );

			// echo to the room that a person has connected
			client.broadcast.to(roomId).emit('update', 'SERVER', user.get('na') + ' has connected to this room');
			client.emit('updaterooms', rooms, roomId);

			//socket.sockets.emit("update", user.na + " is online.");
			//socket.sockets.emit("update-users", users);
			//clients.push(client); //populate the clients array with the client object

		}
	});


});

