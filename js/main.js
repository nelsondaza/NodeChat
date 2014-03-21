
$(function(){

	$('.popup').popup();

	var socket = null;
	var nTimeout = null;

	console.debug( 'init' );

	try {
		socket = io.connect( '', {port:8080} );
		socket.on('connect', function( ) {
			console.debug( 'connected' );
			clearTimeout( nTimeout );
		});
		socket.on('disconnect', function( ) {
			clearTimeout( nTimeout );
			nTimeout = setInterval( function( ) {
				console.debug( 'not connected' );
				// No socket
			}, 1000 * 30 );
		});
	}
	catch ( e ) {
		socket = null;
	}

});


