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

app.console = console;
app.class = {
	name: 'Server',
	package: 'app.server',
	type: 'Express'
};

app.views = require( Path.resolve( __dirname + "/../js/views.js" ) );
app.models = require( Path.resolve( __dirname + "/../js/models.js" ) );

app.views.initialize( app );
app.models.initialize( app );

socket.on('connection', function ( socket ) {
	console.log( "Conectado..." );
});
