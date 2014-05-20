/**
 * Created with JetBrains PhpStorm.
 * User: ndaza
 */
	var views = {
		app: null,
		loaded: false,
		initialize: function (app) {
			this.app = app;
			console.app(this.app.class.type + ': ' + this.app.class.name + ': Views' );
		},
		/**
		 * Load modules
		 * @param func
		 */
		load: function ( ) {
			for( var c = 0; c < this.sets.length; c ++ ) {
				this.createLoad = this.sets[c];
				this.createLoad();
			}
			this.loaded = true;
			console.app(this.app.class.type + ': ' + this.app.class.name + ' views loaded.');
			console.groupEnd();
		},
		sets: [],
		set: function( func ){
			this.sets.push( func );
		},
		/**
		 * @param {String} name
		 * @param {Object} [attributes]
		 * @param {Object} [options]
		 * @returns Backbone.View
		 */
		create: function( name, attributes, options ) {
			if( this.app.views[name] )
				throw Error( 'View name "' + name + '" already defined.' );

			if( attributes && attributes.initialize ) {
				attributes.customInitialize = attributes.initialize;
				delete attributes.initialize;
			}

			attributes = _.extend({
				class : {
					name: name,
					package: 'app.views',
					type: 'View'
				},
				_templateViewSelector: null,
				_rendered: false,
				_childViews: [],
				_childViewConstructor: null,
				_childViewSelectorHolder: '',
				_childViewAttributes: {},
				$childEl: null,

				className: name.toLowerCase( ),
				constructor : function( ) {
					if( arguments[0] && !isNaN( arguments[0] ) )
						arguments[0] = {id:arguments[0]};
					console.view( this.class.type + ': ' + this.class.name + ' constructor: ', arguments );
					return Backbone[this.class.type].apply( this, arguments );
				},
				initialize : function( localOptions ) {
					console.view( this.class.type + ': ' + this.class.name  + ' initialize: ', arguments );

					if( this.model ) {
						console.view( this.class.type + ': ' + this.class.name  + ' initialize using Model' );
						this.listenTo( this.model, 'change', this.modelChanged );
					}
					if( this.collection ) {
						console.view( this.class.type + ': ' + this.class.name  + ' initialize using Collection' );

						this._childViewConstructor = localOptions.childViewConstructor || options.childViewConstructor;
						this._childViewAttributes = localOptions.childViewAttributes || options.childViewAttributes;
						this._childViewSelectorHolder = localOptions.childViewSelectorHolder || options.childViewSelectorHolder;
						this._childViews = [];

						if (!this._childViewConstructor)
							throw "no child view constructor provided";

						this.collection.each(this.collectionAdd);

						this.listenTo( this.collection, 'add', this.collectionAdd );
						this.listenTo( this.collection, 'remove', this.collectionRemove );
						this.listenTo( this.collection, 'change', this.collectionChanged );
					}

					this.on( 'all', function( ) {
						console.view( this.class.type + ': ' + this.class.name  + ' event: ', arguments );
					});

					this.customInitialize( localOptions );
				},
				customInitialize : function( localOptions ) {
					console.view( this.class.type + ': ' + this.class.name  + ' default customInitialize: ', arguments );
				},
				modelChanged : function( model, options ) {
					console.view( this.class.type + ': ' + this.class.name  + ' modelChanged: ', arguments );
					for ( var sIndex in model.changed ) {
						if( !model.hasListenerFor( sIndex ) )
							this.renderValue( '.' + sIndex, model.changed[sIndex] );
					}

				},
				collectionAdd : function( model ) {
					console.view( this.class.type + ': ' + this.class.name  + ' collectionAdd: ', arguments );

					var config = _.extend(this._childViewAttributes, {model: model});
					var childView = new this._childViewConstructor(config);

					this._childViews.push(childView);

					if (this._rendered)
						this.$childEl.append(childView.render().el);
				},
				collectionRemove : function( model ) {
					console.view( this.class.type + ': ' + this.class.name  + ' collectionRemove: ', arguments );
					var viewToRemove = _(this._childViews).select(function(cv) { return cv.model === model; })[0];
					this._childViews = _(this._childViews).without(viewToRemove);

					if (this._rendered)
						viewToRemove.$el.remove();
				},
				collectionChanged : function( collection, options ) {
					console.view( this.class.type + ': ' + this.class.name  + ' collectionChanged: ', arguments );
				},
				render: function() {
					console.view( this.class.type + ': ' + this.class.name  + ' default render: ', arguments );

					if( !this.template && this._templateViewSelector )
						this.template = _.template( $(this._templateViewSelector).html( ) );

					this._rendered = true;

					if( this.model && this.model.id )
						this.$el.attr('data-id', this.model.id);
					this.$el.attr('data-type', this.class.name);

					if( this.template )
						this.$el.html( this.template( ( this.model ? this.model.attributes : {} ) ) );

					if ( this.collection ) {
						if( !this.$childEl ) {
							if (this._childViewSelectorHolder)
								this.$childEl = this.$(this._childViewSelectorHolder);
							else
								this.$childEl = this.$el;
						}

						this.$childEl.empty();

						var self = this;
						_(this._childViews).each(function(childView) {
							self.$childEl.append(childView.render().el);
						});
					}

					return this;
				},
				renderValue : function( element, value ){
					console.view( this.class.type + ': ' + this.class.name  + ' render value: ', arguments );
					this.$(element).stop( ).fadeOut( "slow", function( ) {
						$(this).html( value ).fadeIn( "slow" );
					});
				},
				getDataId: function( ) {
					return ( this.model && this.model.id ? this.model.id : null );
				},
				getDataType: function( ) {
					return this.class.name;
				}

			}, attributes || {});

			return Backbone[attributes.class.type].extend( attributes, options );
		}
	};

	views.set( function ( ) {

		this.LoginView = this.create('LoginView', {
			_templateViewSelector: '#loginTemplate',
			events: {
				"click .submit.button": function( event ){
					console.view( this.class.type + ': ' + this.class.name  + ' submit: ', arguments );
					event.preventDefault();
					var name = this.$('#name').val();
					var roomId = this.$('#room').dropdown('get').value();
					var regExp = new RegExp("[^0-9a-z\\_\\-\\.]+", "ig");

					this.showError( );
					this.showFieldError( 'name', null );
					this.showFieldError( 'room', null );

					if( !name || name.match(regExp) != null ) {
						this.showFieldError( 'name', 'Please check your user name. (a-z,0-9,-,_,.)' );
						this.$('#name').focus();
					}
					else if( !roomId ) {
						this.showFieldError( 'room', 'Please select a room.' );
					}
					else {
						this.loadingText('Logging in...');
						this.trigger('join',name, roomId);
					}
				}
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
				return this;
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
				return this;
			},
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
				return this;
			}
		});

		this.MenuOptionView = this.create('MenuOptionView',{
			tagName: 'a',
			_templateViewSelector: '#menuOptionTemplate',
			className: "item",
			events: {
				"click a": function( event ){
					event.preventDefault();
				}
			},
			initialize: function( options ){
				var self = this;
				this.listenTo( this.model, 'relational:change:us', function( ) {
					self.renderValue( '.label', this.model.get('us').length );
				} );
			},
			setActive: function ( active ) {
				this.$('.icon,.label').toggleClass('teal', active == true);
			}
		});

		this.MenuView = this.create('MenuView',{
			_templateViewSelector: '#menuTemplate',
			events: {
				"click .submit.button": function( event ){
					event.preventDefault();
					$('.ui.sidebar').sidebar();
					$('.demo.sidebar').sidebar('toggle');
				}
			},
			setActive: function( roomId ) {
				_(this._childViews).each(function(childView) {
					childView.setActive( childView.getDataId() == roomId );
				});
			}
		},{
			childViewConstructor: this.MenuOptionView,
			childViewSelectorHolder: '#menuRooms',
			childViewAttributes: {}
		});

		this.MessageView = this.create('MessageView',{
			_templateViewSelector: '#messageTemplate',
			className: "item",
			events: {
				"click a": function( event ){
					event.preventDefault();
				}
			},
			initialize: function( options ){
				var self = this;
				this.listenTo( this.model, 'relational:change:us', function( ) {
					self.renderValue( '.label', this.model.get('us').length );
				} );
			},
			setActive: function ( active ) {
				this.$('.icon,.label').toggleClass('teal', active == true);
			}
		});

		this.ChatView = this.create('ChatView',{
			_templateViewSelector: '#chatTemplate',
			events: {
				"click .submit.button": function( event ){
					event.preventDefault();
				}
			}
		},{
			childViewConstructor: this.MessageView,
			childViewSelectorHolder: '#chatMessages',
			childViewAttributes: {}
		});

		/*

		this.Team = this.create('Team', {
			template: _.template(
				'<div class="im"><img src="https://www.wikifutbol.net/dayscore/images/teams/<%= id %>.png" alt="<%= na %>"></div><div class="na"><%= na %></div>'
			)
		});
		this.Match = this.create('Match', {
			tagName: 'tr',
			classInterval: null,
			template: _.template( '<td class="ti"><%= this.time( ) %></td>' +
				'<td class="lo"></td>' +
				'<td class="sc  <%= sa %>">' +
				'<span class="sclo"><%= sclo %> <small><%= ( scpelo > 0 ? scpelo : \'\' ) %></small></span>' +
				'<span class="sa <%= sa %>"> - </span>' +
				'<span class="scvi <%= sa %>"><small><%= ( scpevi > 0 ? scpevi : \'\' ) %></small> <%= scvi %></span>' +
				'</td>' +
				'<td class="vi"></td>' +
				'<td class="min600 re"><%= re %></td>' +
				'<td class="min800 st"><%= st %></td>' +
				'<td>' +
				'<% if ( tv ) { %>' +
				'<img src="https://www.wikifutbol.net/dayscore/images/tvs/<%= tv %>.jpg" alt="<%= tv %>">' +
				'<% } %>' +
				'</td>'
			),
			render: function( ) {

				this.model.set( 'sclo', this.model.get('lo').get('sc') );
				this.model.set( 'scpelo', this.model.get('lo').get('pe') );
				this.model.set( 'scvi', this.model.get('vi').get('pe') );
				this.model.set( 'scpevi', this.model.get('vi').get('pe') );

				this.$el.html( this.template( this.model.attributes ) );

				var viewTeamLo = new this.Team({
					model: this.model.get('lo')
				});

				var viewTeamVi = new this.Team({
					model: this.model.get('vi')
				});

				viewTeamLo.render( );
				viewTeamVi.render( );

				this.$(".lo").html( viewTeamLo.$el );
				this.$(".vi").html( viewTeamVi.$el );

				this.listenTo(this.model, 'change', this.shapeUpdate);

				return this;
			},
			initialize: function( ){
				var self = this;
				this.listenTo(this.model, 'change:ti', function( model, value, options ) {
					self.renderValue( '.ti', self.time( ) );
				});
			},
			changeTeam: function( ) {
				console.view( this.class.type + ': ' + this.class.name  + ' changeTeam: ', arguments );
			},
			shapeUpdate: function( ) {
				console.view( this.class.type + ': ' + this.class.name  + ' shapeUpdate: ', arguments );
				var self = this;
				self.$el.removeClass('normal');
				self.$el.addClass('updated');
				clearInterval( self.classInterval );
				self.classInterval = setTimeout(function(){
					clearInterval( self.classInterval );
					self.$el.removeClass('updated');
					self.$el.addClass('normal');
					self.classInterval = setTimeout(function(){
						clearInterval( self.classInterval );
						self.$el.removeClass('normal');
					}, 2000);
				}, 2000);
			},
			time: function( ) {
				var date = new Date( ( this.model.get('ti') + (new Date).getTimezoneOffset( ) * 60 ) * 1000 );
				return [
					( date.getHours( ) <= 9 ? '0' : '' ) + date.getHours( ),
					( date.getMinutes( ) <= 9 ? '0' : '' ) + date.getMinutes( )
				].join(':');
			}

		});
		this.Round = this.create('Round', {
			template: _.template(
				'<table>' +
					'<tbody>' +
					'<tr>' +
					'<th>FECHA</th>' +
					'<th>LOCAL</th>' +
					'<th></th>' +
					'<th>VISITANTE</th>' +
					'<th>ÁRBITRO</th>' +
					'<th>ESTADIO</th>' +
					'<th></th>' +
					'</tr>' +
					'</tbody>' +
					'</table>'
			),
			render: function( ) {
				this.$el.html( this.template( this.model.attributes ) );
				var self = this;

				this.model.get('mt').each( function( match ) {
					var viewMatchP = new this.Match({
						model: match
					});
					viewMatchP.render( );
					self.$('tbody').append( viewMatchP.$el );
				});

				return this;
			},
			initialize: function( ){
				this.listenTo(this.model, 'add:mt', this.addMatch);
			},
			addMatch : function(model, collection, event){
				var viewMatchP = new this.Match({
					model: model,
					id: "match." + model.id
				});

				viewMatchP.render( );
				this.$('tbody').append( viewMatchP.$el );
			}
		});

		this.AddImage  = this.create('AddImage',  {
			render: function( ) {
				if( this.model ) {
					var styleFooterAdds = '';
					var styleFooterAddsDefault = "";

					if( this.model.attributes.default ) {

						this.$el.attr('id', "adds" + this.model.attributes.id );

						styleFooterAddsDefault =
							"#adds" + this.model.attributes.id + " {" +
								"background: transparent url('" + this.model.attributes.default + "') no-repeat center center;" +
							"}"

						for( var sIndex in this.model.attributes ) {
							if( sIndex != 'default' && sIndex != 'id' && this.model.attributes[sIndex] ) {
								if( sIndex.indexOf( "w" ) == 0 )
									styleFooterAdds += "@media only screen and (max-width: " + sIndex.replace( /w/, '' ) + "px) {";
								else if( sIndex.indexOf( "big" ) == 0 )
									styleFooterAdds += "@media only screen and (min-width: 801px) {";
								styleFooterAdds += styleFooterAddsDefault.replace( this.model.attributes.default, this.model.attributes[sIndex] ) + "}";
							}
						}

						this.$el.html( $('<style>',{type:"text/css"}).text( styleFooterAddsDefault + styleFooterAdds ) );
					}
				}
				return this;
			},
			renderValue : function( element, value ){
				this.render( );
			}
		});
		this.AddZone = this.create('AddZone', {
			render: function( ) {
				if( this.model ) {
					var image = new app.views.AddImage({
						model:this.model.get('image')
					});
					this.$el.html( image.render().$el );

					this.$el.removeAttr('style');
					if( this.model.css )
						this.$el.attr('style', this.model.css);

					this.$el.off('click');
					this.$el.removeClass('clickable');
					if( this.model.get('link') ) {
						var model = this.model;
						this.$el.addClass('clickable');
						this.$el.on( 'click', function( evt ){
							evt.preventDefault();
							window.open( model.get('link') );
						})
					}
				}
				return this;
			},
			renderValue : function( element, value ){
				this.render( );
			}
		});
		this.Adds = this.create('Adds', {
			render: function( ) {
				console.view( this.class.type + ': ' + this.class.name  + ' render: ', arguments );
				if( this.model ) {
					this.$el.empty( );

					if( this.model.get('header') ) {
						var header = new app.views.AddZone({
							model: this.model.get('header'),
							className: 'header'
						});
						header.render( );
						this.$el.append( header.$el );
					}

					if( this.model.get('bar') ) {
						var bar = new app.views.AddZone({
							model: this.model.get('bar'),
							className: 'bar'
						});
						bar.render( );
						this.$el.append( bar.$el );
					}

					if( this.model.get('power') ) {
						var power = new app.views.AddZone({
							model: this.model.get('power'),
							className: 'power'
						});
						power.render( );
						this.$el.append( power.$el );
					}

					if( this.model.get('footer') ) {
						var footer = new app.views.AddZone( {
							model:this.model.get('footer'),
							className: 'footer'
						});
						footer.render( );
						$('footer.pub:first').html( footer.$el );
					}
				}
				return this;
			}
		});

		this.NavOpt = this.create('NavOpt', {
			template: _.template(
				'<span class="name">' +
				'<% if( list.length == 1 ) { %>' +
					'<%= list[0].name %>' +
				'<% } else { %>' +
					'<%= name %>' +
				'<% } %>' +
				'</span>' +
				'<% if( badges > 0 ) { %>' +
					'<span class="badge"><%= badges %></span>' +
				'<% } %>' +
				'<% if( list.length > 1 ) { %>' +
					'&nbsp;<select class="list">' +
					'<% _.each( list, function( op ) { %>' +
						'<option value="<%= op.id %>"><%= op.name %></option>' +
					'<% }) %>' +
					'</select>' +
				'<% } %>'
			),
			events: {
				"click": "navegate",
				"change select": "navegateOption"
			},
			render: function() {
				console.view( this.class.type + ': ' + this.class.name  + ' default render: ', arguments );

				if( this.model.get('default') == 1 )
					this.$el.attr( 'data-active', 1 );
				else
					this.$el.removeAttr( 'data-active' );

				if( this.template && this.model )
					this.$el.html( this.template( this.model.attributes ) );
				return this;
			},
			navegate: function( event ) {
				console.view( this.class.type + ': ' + this.class.name  + ' navegate: ', arguments );
				event.preventDefault();
				event.stopPropagation();

				if( event.target == this.el &&  !this.$el.attr('data-active') ) {
					var list = this.model.get('list') || [];
					if( list && list.length >= 1 ) {
						var $select = this.$( 'select:first');
						app.stage.location.set( $select.val( ) );
					}
					else {
						app.stage.location.set( this.model.id );
					}

					this.$el.siblings('.' + this.className).removeAttr('data-active');
					this.$el.attr('data-active', 1);
				}
			},
			navegateOption: function( event ) {
				console.view( this.class.type + ': ' + this.class.name  + ' navegateOption: ', arguments );
				event.preventDefault();
				event.stopPropagation();

				this.$el.siblings('.' + this.className).removeAttr('data-active');
				this.$el.attr('data-active', 1);

				var $select = $(event.currentTarget);
				app.stage.location.set( $select.val( ) );

			},
			setOption: function( id ) {
				console.view( this.class.type + ': ' + this.class.name  + ' setOption: ', arguments );
				var $option = this.$('option[value=' + id + ']');
				if( $option.length > 0 ) {
					this.$el.siblings('.' + this.className).removeAttr('data-active');
					this.$el.attr('data-active', 1);

					var opt = this.$( 'select:first option[value=' + id + ']');
					opt.closest( 'select' ).find( 'option' ).removeAttr( 'selected' );
					opt.closest( 'select' ).val( id );
					opt.attr( 'selected', 'selected' );
					return true;
				}
				return false;
			}
		});
		this.Nav = this.create('Nav', {
			tagName: 'nav',
			navOpts: [],
			render: function( ) {
				console.view( this.class.type + ': ' + this.class.name  + ' render: ', arguments );
				var self = this;

				if( this.model ) {
					this.$el.empty( );
					this.model.get('opts').each( function( option ) {
						if( option.get('list') == 1 )
							option.set('list', self.model.get('tournaments'));

						var viewNavOpt = new app.views.NavOpt({
							model: option
						});
						viewNavOpt.render( );
						self.$el.append( viewNavOpt.$el );
						self.navOpts.push( viewNavOpt );
					});
				}

				return this;
			},
			setOption: function( id ) {
				_.each( this.navOpts, function( viewNavOpt ) {
					viewNavOpt.setOption( id );
				});
			}
		});

		this.Tournament = this.create('Tournament', {
			tagName: 'section',
			className: 'tournaments',
			template: _.template(
				'<% if( options.length > 1 ) { %>' +
				'<menu>' +
					'<ul>' +
					'<% _.each( options, function( op ) { %>' +
						'<li><a href="#<%= id %>/<%= op.id %>"><%= op.name %></a></li>' +
					'<% }) %>' +
					'</ul>' +
				'</menu>' +
				'<% } %>'
			),
			events: {
			}
		});
*/
	});

if( typeof module != 'undefined' )
	module.exports = views;
