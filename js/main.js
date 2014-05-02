
<<<<<<< HEAD
/*

 */
=======
$(function(){

	$.fn.semantic.settings.debug = false;

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
		socket.on('roomslist', function( data ) {
			$('#login .field .menu:first').empty();
			for( var sIndex in data ) {
				$('#login .field .menu:first').append('<div class="item" data-value="'+ sIndex + '">' + data[sIndex].na + '</div>');
			}
			$('#login .dimmer').removeClass('active');
			$('.ui.dropdown').dropdown();
		});
	}
	catch ( e ) {
		socket = null;
	}

});


>>>>>>> 79bd9d290dbf2eb359a1467a6a4a6ee2aced23c4
