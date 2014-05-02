/**
 * Created by ndaza on 12/03/14.
 */

var express = require('express');
var app = express();
<<<<<<< HEAD
var io = require('socket.io').listen(app);

app.listen(8080);

// routing
// usernames which are currently connected to the chat
var usernames = {};

io.sockets.on('connection', function (socket) {

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.username, data);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
});
=======
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
>>>>>>> 79bd9d290dbf2eb359a1467a6a4a6ee2aced23c4
