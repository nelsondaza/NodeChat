$(function(){

	window.widgetVersion = 1.103;	
	window.addGAEvent = function ( category, action, label, value )	{

		if( !window.refHost ) {

			var url = "" + ( window.location != window.parent.location && cleanRequest( document.referrer ) != cleanRequest( window.location.href ) ? document.referrer: '' );
			var parts = url.replace(/www\./, '').split("/");
			window.refHost = parts[2];			

			if( !window.refHost )
				window.refHost = window.getRequest( 'ref' + widgetVersion );				
			if( !window.refHost )
				window.refHost = 'default';				

			addGAEvent( 'Navegación', 'URL', cleanRequest( url ), widgetVersion );
			addGAEvent( 'Navegación', 'Version', widgetVersion, widgetVersion );

			if( window.top.location != window.parent.location ) {
				$('div.sections:first').css({color: '#666','text-align':'center',padding:'20px'}).html( '<h3>This widget Can\'t be included in a recursive frame.</h3><h4>Please use it in a single iframe.</h4>' );
				throw Error( 'This widget Can\'t be included in a recursive frame.' );
			}

		}

		if( action != 'URL' && action != 'Socket' && action != 'Version' )
			label = ( label ? label + '-' : '' ) + window.refHost;

		if( typeof( _gaq ) != 'undefined' )	{
			_gaq.push(['_trackEvent', category, action, label, ( !isNaN( value ) && value > 0 ? parseInt( value, 10 ) : 0 )]);
			//console.log( ['_trackEvent', category, action, label, ( !isNaN( value ) && value > 0 ? parseInt( value, 10 ) : 0 )] );
		}
		else if( typeof( ga ) != 'undefined' )	{
			ga('send', 'event', category, action, label, ( !isNaN( value ) && value > 0 ? parseInt( value, 10 ) : 0 ) );
			//console.log( ['send', 'event', category, action, label, ( !isNaN( value ) && value > 0 ? parseInt( value, 10 ) : 0 )] );
		}
	}

	window.getRequest = function( name ){
		return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
	},

	window.cleanRequest = function( url ){
		url = url || window.location.href;
		return url.replace( /[&\?]?rand=[0-9\.]+/, '' ).replace( /[&\?]?ref[0-9\.]+=[^&]+/, '' );
	},

	window.reloadWidget = function( ) {
		//$('div.sections').empty( );
		var option = window.lastContentShown[1];
		if (option != 'partidos' && option != 'posiciones'){
			$('div.sections').empty( );
		}
		window.mainApp.showContent( window.lastContentShown[0], window.lastContentShown[1], window.lastContentShown[2] );
		//document.location = document.location.href.replace( /[&\?]?ref[0-9\.]+=[^&]+/, '' ).replace( /rand=([0-9\.]+)/, 'rand=' + ( Math.random( ) * 30 ) + '&ref' + widgetVersion + '=' + window.refHost );
	}

	require.config({
		baseUrl: 'js/',
		paths: {
			// Core Libraries
			//jquery: "vendor/jquery-1.10.2.min",
			underscorestring: "plugins/underscore.string-2.3.0.min",
			underscore: "vendor/underscore-1.5.1.min",
			backbone: "vendor/backbone-1.0.0.min",
			// Require.js Plugins
			text: "plugins/require.text-2.0.9"
		},
		// Sets the configuration for your third party scripts that are not AMD compatible
		shim: {
			"jquery": {
				//exports: "$"  //attaches "Backbone" to the window object
			},
			"underscore": {
				exports: '_'
			},
			"underscorestring": {
				deps: ['underscore']
			},
			"backbone": {
				deps: ['underscore'],
				exports: "Backbone"  //attaches "Backbone" to the window object
			}
		} // end Shim Configuration
	});

	define(
		[
			'underscore',
			'backbone',
			'underscorestring'
		],
		function( _, Backbone ) {
			_.str = require(['underscorestring']);

			var nTimeout = null;
			var socket = null;
			var initWidth = $('body').width();

			try {
				socket = io.connect( '', {port:8090} );
				socket.on('connect', function( ) {
					clearTimeout( nTimeout );
					addGAEvent( 'Navegación', 'Socket', 'connect' );
				});
				socket.on('disconnect', function( ) {
					addGAEvent( 'Navegación', 'Socket', 'disconnect' );
					clearTimeout( nTimeout );
					nTimeout = setInterval( function( ) {
						reloadWidget( );
					}, 1000 * 30 );
				});
			}
			catch ( e ) {
				socket = null;
			}

			if( !socket ) {
				addGAEvent( 'Navegación', 'Socket', 'disable' );
				clearTimeout( nTimeout );
				nTimeout = setInterval( function( ) {
					reloadWidget( );
				}, 1000 * 30 + Math.round( Math.random( ) * 120 ) );
			}
			else {
				addGAEvent( 'Navegación', 'Socket', 'enable' );
			}

			if( !Backbone || !Backbone.Model || !Backbone.Model.extend ) {
				document.location.reload( );
				return;
			}

			addGAEvent( 'Navegación', 'Inclusión', null, ( socket ? 1 : 0 ) );

			var activeTournaments = {
				'liga-postobon': {
						id: 149588,
						name: 'LIGA POSTOBÓN'
				},
				'copa-postobon': {
					id: 150923,
					name: 'COPA POSTOBÓN'
				},
				'torneo-postobon': {
					id: 149805,
					name: 'TORNEO POSTOBÓN'
				}
			};

			var activeOptions = {
				partidos: {
					na: 'PARTIDOS',
					id: 'partidos'
				},
				posiciones: {
					na: 'POSICIONES',
					id: 'posiciones'
				},
				reclasificacion: {
					na: 'RECLASIFICACIÓN',
					id: 'reclasificacion'
				},
				descenso: {
					na: 'DESCENSO',
					id: 'descenso'
				},
				goleadores: {
					na: 'GOLEADORES',
					id: 'goleadores'
				}
			};

			var monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

			var MatchModel = Backbone.Model.extend({
				defaults: {
					idAttribute: 'id',
					id: 0,
					ti: 0,
					lo: {
						id: 0,
						na: '',
						sc: 0,
						pe: 0
					},
					vi: {
						id: 0,
						na: '',
						sc: 0,
						pe: 0
					},
					re: '',
					st: '',
					tv: ''
				},
				time: function( ) {
					var date = new Date( ( this.ti + (new Date).getTimezoneOffset( ) * 60 ) * 1000 );
					return [
						( date.getHours( ) <= 9 ? '0' : '' ) + date.getHours( ),
						( date.getMinutes( ) <= 9 ? '0' : '' ) + date.getMinutes( )
					].join(':');
				}
			});
			var RoundModel = Backbone.Model.extend({
				defaults: {
					idAttribute: 'id',
					id: 0,
					na: '',
					ac: 0,
					relations: [{
						type: Backbone.HasMany,
						key: 'mt',
						relatedModel: 'MatchModel'/*,
						reverseRelation: {
							key: 'rou',
							includeInJSON: 'id'
						}*/
					}],
					groupDate: function( timestamp ) {
						var date = new Date( ( timestamp + ( (new Date).getTimezoneOffset( ) - ( 5 * 60 ) ) * 60 ) * 1000 );
						return [
							monthNames[date.getMonth( )],
							( date.getDate( ) <= 9 ? '0' : '' ) + date.getDate( ),
							'/',
							date.getFullYear( )
						].join(' ');
					},
					matchTime: function( timestamp ) {
						var date = new Date( ( timestamp + ( (new Date).getTimezoneOffset( ) - ( 5 * 60 ) ) * 60 ) * 1000 );
						return [
							( date.getHours( ) <= 9 ? '0' : '' ) + date.getHours( ),
							( date.getMinutes( ) <= 9 ? '0' : '' ) + date.getMinutes( )
						].join(':');
					}
				}
			});
			var StageModel = Backbone.Model.extend({
				defaults: {
					idAttribute: 'id',
					id: 0,
					na: '',
					ac: 0,
					relations2: [{
						type: Backbone.HasMany,
						key: 'ro',
						relatedModel: 'RoundModel'/*,
						reverseRelation: {
							key: 'sta',
							includeInJSON: 'id'
						}*/
					}]
				}
			});
			var TournamentModel = Backbone.Model.extend({
				defaults: {
					idAttribute: 'id',
					id: 0,
					na: '',
					des: 1,
                    scr: 0,
					ops: [],
					td: [],
					relations: [{
						type: Backbone.HasMany,
						key: 'st',
						relatedModel: 'StageModel'/*,
						reverseRelation: {
							key: 'sta',
							includeInJSON: 'id'
						}*/
					}]
				}
			});
			var StageRankingModel = Backbone.Model.extend({
				defaults: {
					idAttribute: 'id',
					id: 0,
					na: '',
					sg: []
				}
			});

			var Collection = Backbone.Collection.extend({
				model: null,
				url: '',
				comparator: false,
				parse: function( response ) {
					return response.list;
				}
			});

			var OldTournaments = Backbone.Collection.extend({
				url: 'https://s3.amazonaws.com/WidgetResultadosWin/services/tournament/allTournaments.json?ts='+Date.now()
			});

			var TournamentView = Backbone.View.extend({
				tagName: 'section',
				template: _.template( $('#tournamentTemplate').html( ) ),
				events: {
					"change select:first": function( event ){
						window.mainApp.navigate( '#' + $(event.currentTarget).data('id') + '/' + $(event.currentTarget).val( ), {trigger: true});
					}
				},
				render: function( ) {
					this.$el.html( this.template( this.model.toJSON( ) ) );
					if( this.model.toJSON( ).ops.length <= 1 ) {
						this.$el.find('menu:first').hide( );
						this.$el.css({'padding-top':'10px'});
					}
					return this;
				},
				renderOptions: function( ) {
					var sections = this.$el.find( 'div.subsections:first' );
					this.$el.html( this.template( this.model.toJSON( ) ) );
					return this;
				}
			});
			//TODO
			var OldTournamentsList = Backbone.View.extend({
					el: $("#oldTournamentsContainer").html(),
					events:{
						"change select:first":function( event ){
							idTournament = $(event.currentTarget).val( );
							window.mainApp.refreshContent(idTournament);
							window.mainApp.navigate('#/'+idTournament);																
							$(event.currentTarget).prop('selected',true);
						}
					},
					render: function(){
						var that = this;
						var oldTournaments = new OldTournaments();
						oldTournaments.fetch({					
							success: function(tournaments){
								var template = _.template($("#oldTournamentsTemplate").html(), {tournaments: tournaments.models})
								that.$el.html(template);								
							},
							error: function(e){
								console.error(e);
							}
						})				
					}
				});

			var TournamentOptionsView = Backbone.View.extend({
				tagName: 'div',
				template: _.template( $('#tournamentOptionMatchsTemplate').html( ) ),
				render: function( ) {
					this.$el.html( this.template( {list:this.collection.toJSON( )} ) );
					this.$el.find( 'div.options').css( {
						'overflow-y': 'auto',
						'overflow-x': 'hidden'
					} );
					this.$el.find( 'div.options').height( window.mainApp.heightContent );
					if( window.mainApp.heightContent != 'auto' )
						this.$el.find( 'div.subsections').css( 'min-height', window.mainApp.heightContent + 20 );
					return this;
				}
			});
			var RoundMatchsView = Backbone.View.extend({
				tagName: 'div',
				className: 'matchs',
				template: _.template( $('#roundMatchesTemplate').html( ) ),
				render: function( ) {
					this.$el.html( this.template( this.model.toJSON( ) ) );
					if( window.mainApp.conf && window.mainApp.conf.linking && window.mainApp.conf.linking.matchs ) {
						this.$el.find( 'tr[data-id]' ).addClass('pointer').click( function( e ) {
							var ID = $(this).data('id');
							e.preventDefault( );

							if( ID ) {
								try {
									if( window.top )
										window.top.document.location.href = window.mainApp.conf.linking.matchs.replace( /\[ID\]/, ID );
									else
										window.document.location.href = window.mainApp.conf.linking.matchs.replace( /\[ID\]/, ID );
								}
								catch ( e ) {
									window.open( window.mainApp.conf.linking.matchs.replace( /\[ID\]/, ID ) );
								}
							}

						});
					}
					return this;
				}
			});
			var TournamentOptionsRankingView = Backbone.View.extend({
				tagName: 'div',
				template: _.template( $('#tournamentOptionRankingTemplate').html( ) ),
				render: function( ) {
					this.$el.html( this.template( {list:this.collection.toJSON( )} ) );
					this.$el.find( 'div.options').css( {
						'overflow-y': 'auto',
						'overflow-x': 'hidden'
					} );
					this.$el.find( 'div.options').height( window.mainApp.heightContent );
					if( window.mainApp.heightContent != 'auto' )
						this.$el.find( 'div.subsections').css( 'min-height', window.mainApp.heightContent + 20 );
					return this;
				}
			});
			var StageRankingView = Backbone.View.extend({
				tagName: 'div',
				className: 'ranking',
				template: _.template( $('#stageRankingTemplate').html( ) ),
				render: function( ) {
					this.$el.html( this.template( this.model.toJSON( ) ) );
					//Check if linking.teams is available
					if( window.mainApp.conf && window.mainApp.conf.linking && window.mainApp.conf.linking.teams ) {
						this.$el.find( 'tr[data-id]' ).addClass('pointer').click( function( e ) {
							var ID = $(this).attr('data-id');
							e.preventDefault( );

							if( ID ) {
								try {
									if( window.top )
										window.top.document.location.href = window.mainApp.conf.linking.teams.replace( /\[ID\]/, ID );
									else
										window.document.location.href = window.mainApp.conf.linking.teams.replace( /\[ID\]/, ID );
								}
								catch ( e ) {
									window.open( window.mainApp.conf.linking.teams.replace( /\[ID\]/, ID ) );
								}
							}

						});
					}
					return this;
				}
			});
			var TournamentDeclineView = Backbone.View.extend({
				tagName: 'div',
				className: 'decline',
				template: _.template( $('#tournamentDeclineTemplate').html( ) ),
				render: function( ) {
					this.$el.html( this.template( this.model.toJSON( ) ) );
					this.$el.css( {
						'overflow-y': 'auto',
						'overflow-x': 'hidden'
					} );
					if( window.mainApp.heightContent != 'auto' )
						this.$el.height( window.mainApp.heightContent + 36 );
					return this;
				}
			});
			var TournamentReclassificationView = Backbone.View.extend({
				tagName: 'div',
				className: 'reclassification',
				template: _.template( $('#tournamentReclassificationTemplate').html( ) ),
				render: function( ) {
					this.$el.html( this.template( this.model.toJSON( ) ) );
					this.$el.css( {
						'overflow-y': 'auto',
						'overflow-x': 'hidden'
					} );
					if( window.mainApp.heightContent != 'auto' )
						this.$el.height( window.mainApp.heightContent + 36 );
					return this;
				}
			});
			var TournamentScorersView = Backbone.View.extend({
				tagName: 'div',
				className: 'scorers',
				template: _.template( $('#tournamentScorersTemplate').html( ) ),
				render: function( ) {
					this.$el.html( this.template( this.model.toJSON( ) ) );
					this.$el.css( {
						'overflow-y': 'auto',
						'overflow-x': 'hidden'
					} );
					if( window.mainApp.heightContent != 'auto' )
						this.$el.height( window.mainApp.heightContent + 36 );
					return this;
				}
			});

			var MainApp = Backbone.Router.extend({
				initialize: function( conf ) {
					var self = this;
					this.height = getRequest( 'height' );
					this.id = getRequest( 'id' );
					this.tournaments = [];
					this.options = [];
					this.conf = conf || {};
					this.conf.tournaments = this.conf.tournaments || [];

					if( !this.conf.theme )
						this.conf.theme = 'app';

					$('head').append( '<link rel="stylesheet" href="css/' + this.conf.theme + '.css?' + 'nc93hr7=-wd3535' + widgetVersion + '" />' );

					for( var c = 0; c < this.conf.tournaments.length; c ++ ) {
						if( this.conf.tournaments[c]['id'] && this.conf.tournaments[c]['name'] ) {
							this.tournaments.push( this.conf.tournaments[c] );
							if( this.conf.tournaments[c]['default'] == 1 )
								this.defaultTournament = this.conf.tournaments[c]['id'];
						}
					}

					if( this.tournaments.length == 0 ) {
						this.tournaments.push( activeTournaments['liga-postobon'] );
						this.tournaments.push( activeTournaments['copa-postobon'] );
						this.tournaments.push( activeTournaments['torneo-postobon'] );
					}

					if( !this.defaultTournament )
						this.defaultTournament = this.tournaments[0]['id'];

					var options = getRequest('opts');
					if( options ) {
						options = options.split( "," );
						for( var c = 0; c < options.length; c ++ ) {
							if( activeOptions[options[c]] )
								this.options.push( activeOptions[options[c]] );
						}
					}

					if( this.options.length == 0 ) {
						for( var sIndex in activeOptions )
							this.options.push( activeOptions[sIndex] );
					}

					this.heightContent = ( !this.height ? 'auto' : ( Math.max( 400, this.height ) - 200 ) );
					if( this.heightContent != 'auto' && initWidth <= 300 )
						this.heightContent += 50;

					$('body').prepend( _.template( $('#navTemplate').html( ), {ops:this.tournaments} ) );

					$('footer .powered-by a img').attr( 'title', $('footer .powered-by a img').attr( 'title' ) + ' v' + widgetVersion );

					if( !window.mainRouter )
						window.mainRouter = this;

					this.views = {};
					this.shapeConfig( );

					// Tells Backbone to start watching for hashchange events
					Backbone.history.start();
				},
				// All of your Backbone Routes (add more)
				routes: {
					// When there is no hash bang on the url, the init method is called
					'': 'init',
					':idTournament(/:option)(/)(/:content)(/)': 'showContent'
				},
				'init': function()  {
					var idTournament = ( this.defaultTournament ? this.defaultTournament : $('nav li:first').data('id') );
					if( _.isNumber( idTournament ) )
						this.navigate( '#' + idTournament, {trigger: true, replace: true});
				},
				'showContent' : function( idTournament, option, content ) {
					window.lastContentShown = arguments;
					//console.info( 'showContent: ', [ idTournament, option, content ] );
					if( option )
						addGAEvent( 'Torneo-' + idTournament, option, content );

					var menus = $('nav ul');
					menus.find('li').removeClass( 'selected' );
					if( !isNaN( idTournament ) && idTournament >= 0 ) {
						var menu = menus.find('li[data-id=' + idTournament + ']').addClass( 'selected' );

						$('div.sections>section').hide( );

						var section = $('div.sections>section[data-id=' + idTournament + ']');
						if( section.length == 0 ) {
							var view = this.createTournament( idTournament );
							view.$el.attr( 'data-id', idTournament );
							$('div.sections').append( view.$el );
							if( !option ) {
								option = this.options[0].id;
								this.navigate( '#' + idTournament + '/' + option, {trigger: true, replace: true});
								return;
							}
							section = view.$el;
						}
						section.show( );

						if( !option ) {
							option = this.views[idTournament].model.get('ops')[0].id;
							this.navigate( '#' + idTournament + '/' + option, {trigger: true, replace: true});
							return;
						}

						//section.find('div.subsections>div').hide( );
						var submenus = section.find('menu ul');
						submenus.find('li').removeClass( 'selected' );
						if( _.indexOf( ['partidos','posiciones','reclasificacion','descenso','goleadores'], option ) >= 0 ) {

							var submenu = submenus.find('li[data-id=' + option + ']').addClass( 'selected' );
							var opt = section.find( 'menu select:first option[value=' + option + ']');
							opt.closest( 'select' ).find( 'option' ).removeAttr( 'selected' );
							opt.closest( 'select' ).val( option );
							opt.attr( 'selected', 'selected' );

							var subsection = section.find('div.subsections>div[data-id=' + option + ']');
							if( subsection.length == 0 ) {
								var view = null;
								if( option == 'partidos' )
									view = this.createOptionPartidos( idTournament, option, content );
								else if( option == 'posiciones' )
									view = this.createOptionPosiciones( idTournament, option, content );
								else if( option == 'descenso' )
									view = this.createOptionDescenso( idTournament, option, content );
								else if( option == 'reclasificacion' )
									view = this.createOptionReclasificacion( idTournament, option, content );
								else if( option == 'goleadores' )
									view = this.createOptionGoleadores( idTournament, option, content );
								view.$el.attr( 'data-id', option );
								section.find('div.subsections').html( view.$el );
								subsection = view.$el;
							}
							else {
								if( option == 'partidos' || option == 'posiciones' ) {
									
									if(isNaN(content)||content<=0){
										content = subsection.find( 'select:first option[data-active="1"]').val( );																	
									}
									
									var opt = subsection.find( 'select:first option[value=' + content + ']');									
									if( opt.length == 0 ) {
										opt = subsection.find( 'select:first option[data-active="1"]');
										content = opt.val( );
										this.navigate( '#' + idTournament + '/' + option + '/' + content, {trigger: true, replace: true});
										return;
									}

									opt.closest( 'select' ).find( 'option' ).removeAttr( 'selected' );
									opt.closest( 'select' ).val( content );
									opt.attr( 'selected', 'selected' );
									if( option == 'partidos' ) {
										var data = subsection.find('div.matchs[data-id=' + idTournament + option + content + ']');
										if( data.length == 0 ) {
											$('.options').html('');
											var view = this.createRound( idTournament, option, content );
											view.$el.attr( 'data-id', idTournament + option + content );
											//$('div.options').html(view.$el[0]);
											//subsection.find('div.options').html( view.$el );
											data = view.$el;											
										}else{
											var urlRound = 'https://s3.amazonaws.com/WidgetResultadosWin/services/round/'+content+'.json?ts='+Date.now();
											$.ajax({
													url: urlRound,
													type: 'get',
													data: {},
													dataType: 'json',
													success: function (data) {
														var mt = data.list[0].mt;
														for(var i=0; i<data.list[0].mt.length;i++){
															var loId = mt[i].lo.id;
															var viId = mt[i].vi.id;
															var loSc = mt[i].lo.sc;
															var viSc = mt[i].vi.sc;
															var ref = mt[i].re;
															var st = mt[i].st;
															$("#re-"+mt[i].id).html(ref);
															$("#st-"+mt[i].id).html(st);
															$("#lo-pe-"+loId).html(loSc);
															$("#vi-pe-"+viId).html(viSc);															
														}													
													}
												});
											/*subsection.find('div.matchs').html('');
											var data = subsection.find('div.matchs[data-id=' + idTournament + option + content + ']');										
											//if( data.length == 0 ) {
												var view = this.createRound( idTournament, option, content );
												view.$el.attr( 'data-id', idTournament + option + content );
												console.log(view.$el[0]);											
												//$('div.options').html(view.$el[0]);
												//subsection.find('div.options').html( view.$el );
												data = view.$el;											
											//}
											data.show( );*/
										}
									}
									else if( option == 'posiciones' ) {
										var data = subsection.find('div.ranking[data-id=' + idTournament + option + content + ']');
										if( data.length == 0 ) {
											var view = this.createRanking( idTournament, option, content );
											view.$el.attr( 'data-id', idTournament + option + content );
											$('div.options').html(view.$el[0]);
											subsection.find('div.options').append( view.$el );
											data = view.$el;
										}else{
											var urlPositions = 'https://s3.amazonaws.com/WidgetResultadosWin/services/tableRatingStage/' + content + '.json?ts='+Date.now();
											$.ajax({
													url: urlPositions,
													type: 'get',
													data: {},
													dataType: 'json',
													success: function (data) {
														for (var i=0; i<data.list[0].sg.length; i++){
															var grId = data.list[0].sg[i].id;
															var records = data.list[0].sg[i].tr;
															for(var j=0; j<records.length;j++){
																var teamId = records[j].id;
																var teamNa = records[j].na; 
																var pos = records[j].po;
																var pj = records[j].tg;
																var pg = records[j].wi;
																var pe =records[j].dr;
																var pp = records[j].lo;
																var gf = records[j].go;
																var gc = records[j].gr;
																var gd = records[j].gd;
																var gfv = records[j].gv;
																var gcv = records[j].grv;
																var pt = records[j].pi;
																var img = 'https://s3.amazonaws.com/WidgetResultadosWin/images/teams/'+teamId+'.png';
																$("#pos"+grId+"-"+pos).html(pos <= 9 ? "0"+pos : pos);
																$("#img"+grId+"-"+pos).attr('src',img);
																$("#team"+grId+"-"+pos).html(teamNa);
																$("#tg"+grId+"-"+pos).html(pj);
																$("#wi"+grId+"-"+pos).html(pg);
																$("#dr"+grId+"-"+pos).html(pe);
																$("#lo"+grId+"-"+pos).html(pp);
																$("#go"+grId+"-"+pos).html(gf);
																$("#gr"+grId+"-"+pos).html(gc);
																$("#gd"+grId+"-"+pos).html(gd);
																$("#gv"+grId+"-"+pos).html(gfv);
																$("#grv"+grId+"-"+pos).html(gcv);
																$("#pi"+grId+"-"+pos).html(pt);
															}
														}
														
													}
												});

										}
										/*subsection.find('div.ranking').html('');
										var data = subsection.find('div.ranking[data-id=' + idTournament + option + content + ']');
										if( data.length == 0 ) {
											var view = this.createRanking( idTournament, option, content );
											view.$el.attr( 'data-id', idTournament + option + content );
											$('div.options').html(view.$el[0]);
											subsection.find('div.options').append( view.$el );
											data = view.$el;
										}
										data.show( );*/
									}
								}
							}							
							subsection.show( );
						}
					}
				},
				'refreshContent':function( idTournament) {
					if($("nav ul li.selected a").html() == "LIGA POSTOBÓN"){
						this.tournaments[0].id = idTournament;
					}else if($("nav ul li.selected a").html() == "TORNEO POSTOBÓN"){
						this.tournaments[2].id = idTournament;
					}
					$('body nav').hide();
					$('body').prepend( _.template( $('#navTemplate').html( ), {ops:this.tournaments} ) );
				},
				'createTournament': function( idTournament ) {
					//console.info( 'createTournament: ', [ idTournament ] );

					var tournamentModel = new TournamentModel({
						id: idTournament,
						na: $('nav ul li[data-id=' + idTournament + ']').text( ),
						des: ( $('nav ul li[data-id=' + idTournament + ']').text().toLowerCase().indexOf( 'liga' ) == 0 ? 1 : 0 ),
                        scr: ( $('nav ul li[data-id=' + idTournament + ']').text().toLowerCase().indexOf( 'torneo' ) == 0 ? 1 : 0 ),
                        pos_rec: ( $('nav ul li[data-id=' + idTournament + ']').text().toLowerCase().indexOf( 'copa' ) == 0 ? 1 : 0 ),
                        ops: this.options
					});
					var tournamentView = new TournamentView({
						model: tournamentModel,
						className: 'tournament'
					});

					this.views[idTournament] = tournamentView;

					tournamentView.render( );
					return tournamentView;
				},
				'createOldTournaments': function(){
					var app = this;


				},
				'createOptionPartidos': function( idTournament, option, content ) {
					//console.info( 'createOptionPartidos: ', [ idTournament, option, content ] );

					var app = this;
					var sectionView = this.views[idTournament];
					$('div.loading').show().find('em').text( '' );

					sectionView.collectionView = new TournamentOptionsView();
					sectionView.roundMatchesView = new RoundMatchsView();
					sectionView.oldTournamentsView = new OldTournamentsList();
					sectionView.oldTournamentsView.render();										

					var StagesCollection = Backbone.Collection.extend({
						model: StageModel,
						url: '',
						comparator: false,
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return response.list[0].st;
							}
							return [];
						}
					});

					var stages = new StagesCollection();
					stages.fetch({
						dataType: 'json',
						url:'https://s3.amazonaws.com/WidgetResultadosWin/services/tournament/' + idTournament + '.json?ts='+Date.now(),
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								console.info(response.list[0].st);
								return response.list[0].st;

							}
							return [];
						},
						success: function(collection, response, options) {
							sectionView.collectionView.collection = collection;
							sectionView.collectionView.render( );
							sectionView.collectionView.$el.find('#selectFechas').change( function( ) {
								app.navigate( '#' + idTournament + '/' + option + '/' + this.value, {trigger: true});
							});

							var actualRound = {};
							_.each( collection.toJSON( ), function( stage ){
								if( stage.ac == 1 ) {
									_.each( stage.ro, function( round ){
										if( round.ac == 1 )
											actualRound = round;
									})
								}
							})
							sectionView.roundMatchesView.model = new RoundModel( actualRound );
							sectionView.roundMatchesView.render( );
							sectionView.roundMatchesView.$el.attr( 'data-id', idTournament + option + actualRound.id );
							sectionView.collectionView.$el.find('div.options:first').append( sectionView.roundMatchesView.$el );
							if( socket && !socket.$events['servicesround' + actualRound.id] ) {
								socket.on('servicesround' + actualRound.id, function( data ) {

									var el = sectionView.roundMatchesView.$el.parent().find( '[data-id="' + idTournament + option + actualRound.id + '"]:first' );
									var visible = el.is(":visible");
									el.remove( );
									if( visible ){
										app.showContent( idTournament, option, actualRound.id );
									}
								});
							}

							if( !content || content == actualRound.id ) {
								app.navigate( '#' + idTournament + '/' + option + '/' + actualRound.id, {trigger: false, replace: !content});
							}
							else {
								app.showContent( idTournament, option, content );
							}							
							sectionView.collectionView.$el.find('div#torneos').append(sectionView.oldTournamentsView.$el);	
						},
						error: function(collection, response, options) {
							;
						},
						complete: function( xhr, textStatus ) {
							$('div.loading').hide();
							if( textStatus == 'parseerror') {
								section.html( '<br>' +
									'<div class="progress progress-striped active">' +
									'Error inesperado:' + textStatus +
									'</div>'
								);
							}
						}
					});
					return sectionView.collectionView;
				},
				'createOptionPosiciones': function( idTournament, option, content ) {
					//console.info( 'createOptionPosiciones: ', [ idTournament, option, content ] );

					var app = this;
					var sectionView = this.views[idTournament];
					$('div.loading').show().find('em').text( '' );

					sectionView.collectionView = new TournamentOptionsRankingView();
					sectionView.stageRankingView = new StageRankingView();

					var StagesCollection = Backbone.Collection.extend({
						model: StageModel,
						url: '',
						comparator: false,
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return response.list[0].st;
							}
							return [];
						}
					});

					var stages = new StagesCollection();
					stages.fetch({
						dataType: 'json',
						url:'https://s3.amazonaws.com/WidgetResultadosWin/services/tableRatingTournament/' + idTournament + '.json?ts='+Date.now(),
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return response.list[0].st;
							}
							return [];
						},
						success: function(collection, response, options) {
							sectionView.collectionView.collection = collection;
							sectionView.collectionView.render( );
							sectionView.collectionView.$el.find('select:first').change( function( ) {
								app.navigate( '#' + idTournament + '/' + option + '/' + this.value, {trigger: true});
							});

							var actualStage = {};
							_.each( collection.toJSON( ), function( stage ){
								if( stage.ac == 1 ) {
									actualStage = stage;
								}
							})

							sectionView.stageRankingView.model = new StageModel( actualStage );
							sectionView.stageRankingView.render( );
							sectionView.stageRankingView.$el.attr( 'data-id', idTournament + option + actualStage.id );
							sectionView.collectionView.$el.find('div.options:first').append( sectionView.stageRankingView.$el );

							if( socket && !socket.$events['servicestableRatingStage' + content] ) {
								socket.on('servicestableRatingStage' + content, function( data ) {

									var el = sectionView.stageRankingView.$el.parent().find( '[data-id="' + idTournament + option + actualStage.id + '"]:first' );
									var visible = el.is(":visible");
									el.remove( );
									if( visible )
										app.showContent( idTournament, option, actualStage.id );
								});
							}

							if( !content || content == actualStage.id ) {
								app.navigate( '#' + idTournament + '/' + option + '/' + actualStage.id, {trigger: false, replace: !content});
							}
							else {
								app.showContent( idTournament, option, content );
							}
						},
						error: function(collection, response, options) {
							;
						},
						complete: function( xhr, textStatus ) {
							$('div.loading').hide();
							if( textStatus == 'parseerror') {
								section.html( '<br>' +
									'<div class="progress progress-striped active">' +
									'Error inesperado:' + textStatus +
									'</div>'
								);
							}
						}
					});
					return sectionView.collectionView;
				},
				'createOptionDescenso': function( idTournament, option, content ) {
					//console.info( 'createOptionDescenso: ', [ idTournament, option, content ] );

					var app = this;
					var sectionView = this.views[idTournament];
					$('div.loading').show().find('em').text( 'Cargando Tabla de Descenso...' );

					sectionView.tournamentDeclineView = new TournamentDeclineView();

					var DeclineCollection = Backbone.Collection.extend({
						model: TournamentModel,
						url: '',
						comparator: false,
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return [response.list[0]];
							}
							return [];
						}
					});

					var decline = new DeclineCollection();
					decline.fetch({
						dataType: 'json',
						url:'https://s3.amazonaws.com/WidgetResultadosWin/services/tableDeclineTournament/' + idTournament + '.json?ts='+Date.now(),
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return [response.list[0]];
							}
							return [];
						},
						success: function(collection, response, options) {
							sectionView.tournamentDeclineView.model = new TournamentModel( collection.toJSON( )[0] );
							sectionView.tournamentDeclineView.render( );
							sectionView.tournamentDeclineView.$el.attr( 'data-id', option );
							sectionView.$el.find('div[data-id="' + option + '"] div.options:first').append( sectionView.tournamentDeclineView.$el );

							if( socket && !socket.$events['servicestableDeclineTournament' + idTournament] ) {
								socket.on('servicestableDeclineTournament' + idTournament, function( data ) {

									var el = sectionView.tournamentDeclineView.$el.parent().find( '[data-id="' + option + '"]:first' );
									var visible = el.is(":visible");
									el.remove( );
									if( visible )
										app.showContent( idTournament, option, content );
								});
							}

						},
						error: function(collection, response, options) {
							;
						},
						complete: function( xhr, textStatus ) {
							$('div.loading').hide();
							if( textStatus == 'parseerror') {
								section.html( '<br>' +
									'<div class="progress progress-striped active">' +
									'Error inesperado:' + textStatus +
									'</div>'
								);
							}
						}
					});
					return sectionView.tournamentDeclineView;
				},
				'createOptionReclasificacion': function( idTournament, option, content ) {
					//console.info( 'createOptionReclasificacion: ', [ idTournament, option, content ] );

					var app = this;
					var sectionView = this.views[idTournament];
					$('div.loading').show().find('em').text( 'Cargando Tabla de Reclasificación...' );

					sectionView.tournamentReclassificationView = new TournamentReclassificationView();

					var ReclassificationCollection = Backbone.Collection.extend({
						model: TournamentModel,
						url: '',
						comparator: false,
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return [response.list[0]];
							}
							return [];
						}
					});

					var reclassification = new ReclassificationCollection();
					reclassification.fetch({
						dataType: 'json',
						url:'https://s3.amazonaws.com/WidgetResultadosWin/services/tableReclassificationTournament/' + idTournament + '.json?ts='+Date.now(),
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return [response.list[0]];
							}
							return [];
						},
						success: function(collection, response, options) {
							sectionView.tournamentReclassificationView.model = new TournamentModel( collection.toJSON( )[0] );
							sectionView.tournamentReclassificationView.render( );
							sectionView.tournamentReclassificationView.$el.attr( 'data-id', option );
							sectionView.$el.find('div[data-id="' + option + '"] div.options:first').append( sectionView.tournamentReclassificationView.$el );

							if( socket && !socket.$events['servicestableReclassificationTournament' + idTournament] ) {
								socket.on('servicestableReclassificationTournament' + idTournament, function( data ) {
									var el = sectionView.tournamentReclassificationView.$el.parent().find( '[data-id="' + option + '"]:first' );
									var visible = el.is(":visible");
									el.remove( );
									if( visible )
										app.showContent( idTournament, option, content );
								});
							}

						},
						error: function(collection, response, options) {
							;
						},
						complete: function( xhr, textStatus ) {
							$('div.loading').hide();
							if( textStatus == 'parseerror') {
								section.html( '<br>' +
									'<div class="progress progress-striped active">' +
									'Error inesperado:' + textStatus +
									'</div>'
								);
							}
						}
					});
					return sectionView.tournamentReclassificationView;
				},
				'createOptionGoleadores': function( idTournament, option, content ) {
					//console.info( 'createOptionGoleadores: ', [ idTournament, option, content ] );

					var app = this;
					var sectionView = this.views[idTournament];
					$('div.loading').show().find('em').text( 'Cargando Tabla de Goleadores...' );

					sectionView.tournamentScorersView = new TournamentScorersView();

					var ScorersCollection = Backbone.Collection.extend({
						model: TournamentModel,
						url: '',
						comparator: false,
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return [response.list[0]];
							}
							return [];
						}
					});

					var scorers = new ScorersCollection();
					scorers.fetch({
						dataType: 'json',
						url:'https://s3.amazonaws.com/WidgetResultadosWin/services/tableRankingTournamentScorers/' + idTournament + '.json?ts='+Date.now(),
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return [response.list[0]];
							}
							return [];
						},
						success: function(collection, response, options) {
                            var objJson = collection.toJSON( )[0];
                            objJson.scr = ( $('nav ul li[data-id=' + idTournament + ']').text().toLowerCase().indexOf( 'torneo' ) == 0 ? 1 : 0 );

							sectionView.tournamentScorersView.model = new TournamentModel( objJson );
							sectionView.tournamentScorersView.render( );
							sectionView.tournamentScorersView.$el.attr( 'data-id', option );
							sectionView.$el.find('div[data-id="' + option + '"] div.options:first').append( sectionView.tournamentScorersView.$el );

							if( socket && !socket.$events['servicestableRankingTournamentScorers' + idTournament] ) {
								socket.on('servicestableRankingTournamentScorers' + idTournament, function( data ) {
									var el = sectionView.tournamentScorersView.$el.parent().find( '[data-id="' + option + '"]:first' );
									var visible = el.is(":visible");
									el.remove( );
									if( visible )
										app.showContent( idTournament, option, content );
								});
							}

						},
						error: function(collection, response, options) {
							;
						},
						complete: function( xhr, textStatus ) {
							$('div.loading').hide();
							if( textStatus == 'parseerror') {
								section.html( '<br>' +
									'<div class="progress progress-striped active">' +
									'Error inesperado:' + textStatus +
									'</div>'
								);
							}
						}
					});
					return sectionView.tournamentScorersView;
				},
				'createRound': function( idTournament, option, content ) {
					//console.info( 'createRound: ', [ idTournament, option, content ] );

					var app = this;
					var sectionView = this.views[idTournament];
					$('div.loading').show().find('em').text( 'Cargando Fecha...' );

					sectionView.roundMatchesView = new RoundMatchsView();

					var MatchsCollection = Backbone.Collection.extend({
						model: RoundModel,
						url: '',
						comparator: false,
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return [response.list[0]];
							}
							return [];
						}
					});

					var matchs = new MatchsCollection();
					matchs.fetch({
						dataType: 'json',
						url:'https://s3.amazonaws.com/WidgetResultadosWin/services/round/' + content + '.json?ts='+Date.now(),
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return response.list[0].st;
							}
							return [];
						},
						success: function(collection, response, options) {
							sectionView.roundMatchesView.model = new RoundModel( collection.toJSON( )[0] );
							sectionView.roundMatchesView.render( );
							sectionView.roundMatchesView.$el.attr( 'data-id', idTournament + option + sectionView.roundMatchesView.model.id );
							sectionView.$el.find('div[data-id="' + option + '"] div.options:first').append( sectionView.roundMatchesView.$el );
							if( socket && !socket.$events['servicesround' + content] ) {
								socket.on('servicesround' + content, function( data ) {
									var el = sectionView.roundMatchesView.$el.parent().find( '[data-id="' + idTournament + option + content + '"]:first' );
									var visible = el.is(":visible");
									el.remove( );
									if( visible )
										app.showContent( idTournament, option, content );
								});
							}
						},
						error: function(collection, response, options) {
							;
						},
						complete: function( xhr, textStatus ) {
							$('div.loading').hide();
							if( textStatus == 'parseerror') {
								section.html( '<br>' +
									'<div class="progress progress-striped active">' +
									'Error inesperado:' + textStatus +
									'</div>'
								);
							}
						}
					});
					return sectionView.roundMatchesView;
				},
				'createRanking': function( idTournament, option, content ) {
					//console.info( 'createPositions: ', [ idTournament, option, content ] );

					var app = this;
					var sectionView = this.views[idTournament];
					$('div.loading').show().find('em').text( 'Cargando Posiciones...' );

					sectionView.stageRankingView = new StageRankingView();

					var RankingCollection = Backbone.Collection.extend({
						model: StageModel,
						url: '',
						comparator: false,
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return [response.list[0]];
							}
							return [];
						}
					});

					var ranks = new RankingCollection();
					ranks.fetch({
						dataType: 'json',
						url:'https://s3.amazonaws.com/WidgetResultadosWin/services/tableRatingStage/' + content + '.json?ts='+Date.now(),
						parse: function( response ) {
							if( response.list && response.list.length > 0 ) {
								this.id = response.list[0].id;
								return response.list[0].sg;
							}
							return [];
						},
						success: function(collection, response, options) {
							sectionView.stageRankingView.model = new StageModel( collection.toJSON( )[0] );
							sectionView.stageRankingView.render( );
							sectionView.stageRankingView.$el.attr( 'data-id', idTournament + option + sectionView.stageRankingView.model.id );
							sectionView.$el.find('div[data-id="' + option + '"] div.options:first').append( sectionView.stageRankingView.$el );

							if( socket && !socket.$events['servicestableRatingStage' + content] ) {
								socket.on('servicestableRatingStage' + content, function( data ) {

									var el = sectionView.stageRankingView.$el.parent().find( '[data-id="' + idTournament + option + content + '"]:first' );
									var visible = el.is(":visible");
									el.remove( );
									if( visible )
										app.showContent( idTournament, option, content );
								});
							}

						},
						error: function(collection, response, options) {
							;
						},
						complete: function( xhr, textStatus ) {
							$('div.loading').hide();
							if( textStatus == 'parseerror') {
								section.html( '<br>' +
									'<div class="progress progress-striped active">' +
									'Error inesperado:' + textStatus +
									'</div>'
								);
							}
						}
					});
					return sectionView.stageRankingView;
				},
				'shapeConfig':function( ) {
					var self = this;
					var styleText = '';

					if( this.conf.css )
						styleText = this.conf.css;

					if( this.conf.adds ) {
						if( this.conf.adds.footer ) {
							if( this.conf.adds.footer.code ) {
								$('footer:first div.adds:first').html( this.conf.adds.footer.code );
							}
							else {
								if( this.conf.adds.footer.image && this.conf.adds.footer.image['default'] ) {
									var styleFooterAdds = '';
									var styleFooterAddsDefault = ["footer .adds {",
										"background: transparent url('" + this.conf.adds.footer.image['default'] + "') no-repeat center center;",
										"background-size: 100%;}"].join("");

									for( var sIndex in this.conf.adds.footer.image ) {
										if( sIndex != 'default' && this.conf.adds.footer.image[sIndex] ) {
											if( sIndex.indexOf( "w" ) == 0 )
												styleFooterAdds += "@media only screen and (max-width: " + sIndex.replace( /w/, '' ) + "px) {";
											else if( sIndex.indexOf( "big" ) == 0 )
												styleFooterAdds += "@media only screen and (min-width: 801px) {";
											styleFooterAdds += styleFooterAddsDefault.replace( this.conf.adds.footer.image['default'], this.conf.adds.footer.image[sIndex] ) + "}";
										}
									}

									styleText += styleFooterAddsDefault + styleFooterAdds;
								}
								if( this.conf.adds.footer.link ) {
									$('footer:first div.adds:first').click( function( evt ){
										evt.preventDefault();
										window.open( self.conf.adds.footer.link );
									})
								}
							}
							if( this.conf.adds.footer.style )
								$('footer:first div.adds:first').attr( 'style', this.conf.adds.footer.style );
						}

						if( this.conf.adds.header ) {
							if( this.conf.adds.header.code ) {
								$('header:first div.adds:first').html( this.conf.adds.header.code );
							}
							else {
								if( this.conf.adds.header.image && this.conf.adds.header.image['default'] ) {
									var styleFooterAdds = '';
									var styleFooterAddsDefault = ["header .adds {",
										"background: transparent url('" + this.conf.adds.header.image['default'] + "') no-repeat center center;",
										"background-size: 100%;}"].join("");

									for( var sIndex in this.conf.adds.header.image ) {
										if( this.conf.adds.header.image[sIndex] ) {
											if( sIndex.indexOf( "w" ) == 0 )
												styleFooterAdds += "@media only screen and (min-width: 480px and max-width: " + sIndex.replace( /w/, '' ) + "px) {";
											else if( sIndex.indexOf( "big" ) == 0 )
												styleFooterAdds += "@media only screen and (min-width: 801px) {";
											else if( sIndex.indexOf( "default" ) == 0 )
												styleFooterAdds += "@media only screen and (min-width: 480px) {";
											styleFooterAdds += styleFooterAddsDefault.replace( this.conf.adds.header.image['default'], this.conf.adds.header.image[sIndex] ) + "}";
										}
									}

									styleText += styleFooterAdds;
								}
								if( this.conf.adds.header.link ) {
									$('header:first div.adds:first').click( function( evt ){
										evt.preventDefault();
										window.open( self.conf.adds.header.link );
									})
								}
							}
							if( this.conf.adds.header.style )
								$('header:first div.adds:first').attr( 'style', this.conf.adds.header.style );
						}

					}

					$('head').append( '<style type="text/css">' + styleText + '</style>' );
				}
			});


			$.ajax({
				dataType: "json",
				url: 'adds/' + window.refHost + '.json',
				success: function( data ) {
					window.mainApp = new MainApp( data );
				},
				error: function( ) {
					$.ajax({
						dataType: "json",
						url: 'adds/default.json',
						success: function( data ) {
							window.mainApp = new MainApp( data );
						},
						error: function( ) {
							
							window.mainApp = new MainApp( {} );
						}
					});
				}
			});
		}
	);

});
