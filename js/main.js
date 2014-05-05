// http://tutorialzine.com/2014/03/nodejs-private-webchat/ (GRAPHICS)
// http://tamas.io/advanced-chat-using-node-js-and-socket-io-episode-1/ (ROOMS)
// http://psitsmike.com/2011/10/node-js-and-socket-io-multiroom-chat-tutorial/ (MULTIROOMS)


$(function(){

	$.fn.popup.settings.debug = false;
	$.fn.dropdown.settings.debug = false;

	$('.popup').popup();

	var socket = null;
	var nTimeout = null;
	var $mainGrid = $('#mainGrid');

	var LoginView = Backbone.View.extend({
		template: _.template( $('#loginTemplate').html( ) ),
		events: {
			"click .submit.button": function( event ){
				event.preventDefault();
				var name = this.$('#name').val();
				var roomId = this.$('#room').dropdown('get').value();
				var regExp = new RegExp("[^0-9a-z\\_\\-\\.]+", "ig");

				this.showError( );
				this.showFieldError( 'name', null );
				this.showFieldError( 'room', null );

				if( !name || name.match(regExp) != null ) {
					this.showFieldError( 'name', 'Please check your user name. (a-z,0-9,-,_,.)' );
				}
				else if( !roomId ) {
					this.showFieldError( 'room', 'Please select a room.' );
				}
				else {
					this.loadingText('Logging in...');
					socket.emit('join', name, roomId );
				}
			}
		},
		render: function( ) {
			this.$el.html( this.template( ) );
			return this;
		},
		addRoom: function( name, id ) {
			this.$('.menu:first').append('<div class="item" data-value="'+ id + '">' + name + '</div>');
			this.$('#room').dropdown();
			return this;
		},
		loadingText: function( text ) {
			this.active( false );
			this.$('.dimmer .text em').html( text );
			return this;
		},
		active: function( active ) {
			if( active === undefined || active )
				this.$('.dimmer').removeClass('active');
			else
				this.$('.dimmer').addClass('active');

		},
		showFieldError: function( id, msg ) {
			var field = this.$('#' + id).closest('.field');
			if( msg ) {
				field.addClass('error');
				field.find('.pointing').html(msg).removeClass('hidden');
				this.$('.form:first').addClass('error');
			}
			else {
				field.find('.pointing').html('').addClass('hidden');
				field.removeClass('error');
				this.$('.form:first').removeClass('error');
			}
		}
		,
		showError: function( msg, title ) {
			if( msg ) {
				if( title )
					this.$('.error.message .header').html( title );

				this.$('.error.message p').html( msg );
				this.$('.form:first').addClass('error');
				this.$('.error.message').removeClass('hidden');
			}
			else {
				this.$('.form:first').removeClass('error');
				this.$('.error.message').addClass('hidden');
			}
		}
	});

	var loginView = new LoginView({
		className: 'row',
		id: 'login'
	});

	$mainGrid.html( loginView.render().$el );

	try {
		socket = io.connect( '', {port:8080} );
		socket.on('connect', function( ) {
			loginView.loadingText('Looking for Rooms...');
			console.debug( 'connected' );
			clearTimeout( nTimeout );
		});
		socket.on('disconnect', function( ) {
			console.debug( 'disconnected' );
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

		});

		socket.on('login', function( type, msg ) {
			console.debug( 'Login: ' + type );
			if( type == 'OK' ) {

			}
			else {
				loginView.showError( msg, 'Login' );
			}
		});

		socket.on('update', function( type, msg ) {
			console.debug( 'UPDATE: ' + type + " -> " + msg );
		});

		socket.on('updaterooms', function( rooms, roomId ) {
			console.debug( 'UPDATE: ', rooms, roomId );
		});

	}
	catch ( e ) {
		socket = null;
	}

	if( !socket )
		loginView.loadingText('<span class="ui red header">ERROR: Unable to connect!</span>');

});


