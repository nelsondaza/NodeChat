/**
 * Created by ndaza on 12/03/14.
 */

var cluster = require('cluster');
var https = require('https');
var socketio = require('socket.io');
var socketioch = require('socket.io-clusterhub');
var fs = require('fs');
var chokidar = require('chokidar');
var pathCache = '/home/dayscript/public_html/futbol/dayscore/cache/services';

/**
 * [svrOptions ConfiguraciÃ³n de certificados]
 * @type {Object}
 */
var svrOptions = {
	key: fs.readFileSync('/etc/nginx/conf.d/ssl/wikifutbol.net.key'),
	cert: fs.readFileSync('/etc/nginx/conf.d/ssl/wikifutbol.net.crt'),
	ca: fs.readFileSync('/etc/nginx/conf.d/ssl/gd_bundle.crt')
};


/**
 * ImplementaciÃ³n de Clusters
 */
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
	// Fork workers.
	for (var i = 0; i < (numCPUs/2); i++) {
		cluster.fork();
	}

	cluster.on('exit', function(worker, code, signal) {
		console.log('worker ' + worker.process.pid + ' died');
		cluster.fork();
	});

} else {

	/**
	 * ConfiguraciÃ³n de servidor
	 * Workers can share any TCP connection
	 * In this case its a HTTP server
	 */
	var server = https.createServer(svrOptions, function( request, response ) {
		response.writeHead(200, {"Content-Type" : "application/json"});
		response.end('{"status" : "running"}');
	}).listen( 8090 );

	/**
	 * Se implementa Socket.io utilizando el servidor creado anteriormente.
	 */

	// store must be initialized for master/worker processes
	var store = new (socketioch);
	var io = socketio.listen(server);
	io.enable('browser client minification');  // send minified client
	io.enable('browser client etag');          // apply etag caching logic based on version number
	io.enable('browser client gzip');          // gzip the file
	io.set('log level', 1);

	// set the store to the socket.io-clusterhub instance
	io.configure(function() {
		io.set('store', store);
	});

	/*io.set('transports',
	 [
	 'websocket'
	 , 'flashsocket'
	 , 'htmlfile'
	 , 'xhr-polling'
	 , 'jsonp-polling
	 ]);*/

	/**
	 * Iniciamos la conexiÃ³n con Socket.io.
	 */

	var customers = 0;
	io.sockets.on('connection', function( socket ){
		customers++;

		if ( (customers % 100) == 0 ) {
			console.log('Customers connected: ' + customers);
		}

		socket.on('disconnect', function ( ){
			//console.log('Disconnect from worker: ' + cluster.worker.id);
			customers--;

			if ( (customers % 100) == 0 ) {
				console.log('Customers connected: ' + customers);
			}

		});
	});

	/**
	 * [chokidar Monitor de archivos]
	 */
	var watcher = chokidar.watch( pathCache, {ignored: /^\./, persistent: true} );

	var registerClient = function( path, stats ) {
		if( stats.isFile ( ) ){
			var files = path.split('/');
			var id = files.pop( ).replace(/[^0-9]+/, '');
			var folder = files.pop( );
			console.log( 'Emit: services' + folder + id );
			io.sockets.emit('services' + folder + id, id);
		}
	}

	watcher
		.on('add', registerClient)
		.on('change', registerClient)
		.on('unlink', function( path ) {
			;//console.log('File', path, 'has been removed');
		})
		.on('error', function( error ) {
			;//console.error( 'Error happened', error);
		});

	// Only needed if watching is persistent.
	watcher.close( );
}

