// http://tutorialzine.com/2014/03/nodejs-private-webchat/ (GRAPHICS)
// http://tamas.io/advanced-chat-using-node-js-and-socket-io-episode-1/ (ROOMS)
// http://psitsmike.com/2011/10/node-js-and-socket-io-multiroom-chat-tutorial/ (MULTIROOMS)


$(function(){

	console.debug = console.debug || console.info || console.log;
	console.model = console.model || console.debug;
	console.view = console.view || console.debug;
	console.app = console.app || console.debug;
	console.groupEnd = console.groupEnd || console.debug;

	var app = {};
	app.console = console;
	app.class = {
		name: 'Client',
		package: 'app.client',
		type: 'Custom'
	};

	app.views = views;
	app.models = models;

	app.views.initialize( app );
	app.views.load();

	app.models.initialize( app );
	app.models.load();

	$.fn.popup.settings.debug = false;
	$.fn.dropdown.settings.debug = false;

	$('.popup').popup();

	var socket = null;
	var nTimeout = null;
	var $mainGrid = $('#mainGrid');
	var $mainMenu = $('#mainMenu');
	var chatView = null;

	var loginView = new app.views.LoginView({
		className: 'row',
		id: 'login'
	});
	loginView.on("join", function (name, roomId) {
		console.view(this.class.type + ': ' + this.class.name + ' join: ', arguments);
		socket.emit('join', name, roomId);
	});

	var RoomsCollection = Backbone.Collection.extend({
		model: app.models.Room
	});

	var MessageCollection = Backbone.Collection.extend({
		model: app.models.Message
	});

	var menuView = new app.views.MenuView({
		className: 'ui simple dropdown item',
		id: 'menuHolder',
		collection: new RoomsCollection()
	});

	$mainGrid.html( loginView.render().$el );

	try {
		socket = io.connect( '', {port:8080} );
		socket.on('connect', function( ) {
			loginView.loadingText('Looking for Rooms...');
			console.app( 'connected' );
			clearTimeout( nTimeout );
		});
		socket.on('disconnect', function( ) {
			console.app( 'disconnected' );
			clearTimeout( nTimeout );
			nTimeout = setInterval( function( ) {
				console.debug( 'not connected' );
				// No socket
			}, 1000 * 30 );
		});
		socket.on('roomslist', function( data ) {
			loginView.loadingText('Loading Rooms...');
			for( var sIndex in data ) {
				loginView.addRoom( data[sIndex].na, data[sIndex].id );
			}
			loginView.active();

			socket.emit('join', 'Nelson', 1);
		});

		socket.on('login', function( type, msg, room, user ) {
			console.groupCollapsed('Login');
			console.app( 'Login: ', arguments );
			if( type == 'OK' ) {
				app.user = user;

				loginView.remove();

				$('#menuUserName').text( user.na ).closest('.dropdown').removeClass('hidden');

				$mainMenu.prepend( menuView.render().$el );

				chatView = new app.views.ChatView({
					className: 'column',
					model: new app.models.Room(room),
					collection: new MessageCollection()
				});

				var msgModel = new app.models.Message({
					id: 'update' + chatView.collection.length,
					ty: 'WELLCOME',
					msg: 'Welcome ' + user.na
				});
				chatView.collection.add( msgModel );

				$mainGrid.empty().append( chatView.render().$el );
			}
			else {
				loginView.showError( msg, 'LOGIN').active();
			}
			console.groupEnd('Login');
		});

		socket.on('update', function( type, msg ) {
			console.group('Update');
			if( chatView ) {
				console.app( 'UPDATE VIEW: ' + type + " -> " + msg );
				var msgModel = new app.models.Message({
					id: 'update' + chatView.collection.length,
					ty: type,
					msg: msg
				});
				chatView.collection.add( msgModel );
			}
			else
				console.app( 'UPDATE VIEW: ' + type + " -> " + msg );
			console.groupEnd('Update');
		});

		socket.on('updaterooms', function( rooms, roomId ) {
			console.groupCollapsed('UpdateRooms');
			var roomsArr = [];

			for( var sIndex in rooms ) {
				roomsArr.push( rooms[sIndex] );
			}

			//console.debug( 'UPDATE ROOMS: ', roomsArr, roomId, app.user );
			menuView.collection.set( roomsArr );
			menuView.setActive( app.user.ro );
			console.groupEnd('UpdateRooms');
	});

	}
	catch ( e ) {
		socket = null;
	}

	if( !socket )
		loginView.loadingText('<span class="ui red header">ERROR: Unable to connect!</span>');

});

/*
$("#button").click(function() {
	$('html, body').animate({
		scrollTop: $("#elementtoScrollToID").offset().top
	}, 2000);
});

*/
