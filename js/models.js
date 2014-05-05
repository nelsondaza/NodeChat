/**
 * Created with JetBrains PhpStorm.
 * User: ndaza
 */
	var models = {
		app: null,
		loaded: false,
		/**
		 * Init models
		 * @param app
		 */
		initialize: function (app) {
			this.app = app;
			console.app(this.app.class.type + ': ' + this.app.class.name + ': Models');
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
			console.app(this.app.class.type + ': ' + this.app.class.name + ' models loaded.');

			if (!this.app.views.loaded)
				this.app.views.initialize(this.app);
		},
		sets: [],
		set: function( func ){
			this.sets.push( func );
		},
		/**
		 * @param {String} name
		 * @param {Object} [attributes]
		 * @param {Object} [options]
		 * @returns Backbone.Model
		 */
		create: function (name, attributes, options) {
			if (models[name])
				throw Error('Model name "' + name + '" already defined.');

			attributes = _.extend({
				idAttribute: "id",
				class: {
					name: name,
					package: 'app.models',
					type: 'RelationalModel'
				},
				modelName: name,
				defaults: {
					id: 0
				},

				constructor: function () {
					if (arguments[0] && !isNaN(arguments[0]))
						arguments[0] = {id: arguments[0]};
					console.model(this.class.type + ': ' + this.class.name + ' constructor: ', arguments);
					return Backbone[this.class.type].apply(this, arguments);
				},
				initialize: function () {
					console.model(this.class.type + ': ' + this.class.name + ' initialize: ', arguments);
					this.on('all', function () {
						console.model(this.class.type + ': ' + this.class.name + ' event: ', arguments);
					});
				},
				sync: function (method, model, options) {
					console.model(this.class.type + ': ' + this.class.name + ' sync: ', arguments);
					return Backbone.sync.apply(this, arguments);
				},
				get: function (attr) {
					console.model(this.class.type + ': ' + this.class.name + ' get: ', arguments);
					return this.attributes[attr];
				},
				escape: function (attr) {
					console.model(this.class.type + ': ' + this.class.name + ' escape: ', arguments);
					return _.escape(this.get(attr));
				},
				has: function (attr) {
					console.model(this.class.type + ': ' + this.class.name + ' has: ', arguments);
					return this.get(attr) != null;
				},
				hasListenerFor: function (attributeName) {
					return this._events && !!this._events['change:' + attributeName];
				},
				set: function (attributes, options) {
					console.model(this.class.type + ': ' + this.class.name + ' set: ', arguments);
					if (_.isArray(attributes.list) && !_.isUndefined(attributes.error))
						attributes = attributes.list[0] || {};
					return Backbone[this.class.type].prototype.set.call(this, attributes, options);
				},

				url: function () {
					var url = Backbone[this.class.type].prototype.url.call(this, arguments);
					return url + '.json';
				},

				fetch: function (options) {
					console.model(this.class.type + ': ' + this.class.name + ' fetch: ', arguments);
					var self = this;
					options = _.extend({
						dataType: 'jsonp',
						url: this.url(),
						parse: function (response, options) {
							console.model(self.class.type + ': ' + self.class.name + ':fetch parse: ', arguments);
							return [];
						},
						success: function (collection, response, options) {
							console.model(self.class.type + ': ' + self.class.name + ':fetch success: ', arguments);
						},
						error: function (collection, response, options) {
							console.model(self.class.type + ': ' + self.class.name + ':fetch error: ', arguments);
						},
						complete: function (xhr, textStatus) {
							console.model(self.class.type + ': ' + self.class.name + ':fetch complete: ', arguments);
						}
					}, options || {});


					return Backbone.Collection.prototype.fetch.call(this, options);
				}
			}, attributes || {});
			return Backbone[attributes.class.type].extend(attributes, options);
		}
	};

	models.set(function () {

		this.User = this.create('User', {
			defaults: {
				na: '', // name
				im: '', // image
				ro: null, // id room
				gm: -5 // GMT
			}
		});
		this.Room = this.create('Room', {
			defaults: {
				na: '',     // name
				ow: null,   // owner
				de: '',     // desc
				us: [],     // users
				ti: 0       // creation time
			},
			relations: [
				{
					type: 'HasOne',
					key: 'ou',
					relatedModel: this.User
				},
				{
					type: 'HasMany',
					key: 'us',
					relatedModel: this.User
				}
			],
			time: function () {
				var date = new Date(( this.ti + (new Date).getTimezoneOffset() * 60 ) * 1000);
				return [
					( date.getHours() <= 9 ? '0' : '' ) + date.getHours(),
					( date.getMinutes() <= 9 ? '0' : '' ) + date.getMinutes()
				].join(':');
			}
		});
/*
		this.Round = this.create('Round', {
			defaults: {
				id: 0,
				na: '',
				mt: null
			},
			relations: [
				{
					type: 'HasMany',
					key: 'mt',
					relatedModel: this.Match
				}
			],
			urlRoot: 'https://.../'
		});
		this.Stage = this.create('Stage', {
			defaults: {
				id: 0,
				na: '',
				ro: null
			},
			relations: [
				{
					type: 'HasMany',
					key: 'ro',
					relatedModel: this.Round
				}
			]
		});

		this.AddImage = this.create('AddImage', {
			defaults: {
				id: 0,
				default: '',
				w260: '',
				w320: '',
				w480: '',
				w600: '',
				w800: '',
				big: ''
			}
		});
		this.AddZone = this.create('AddZone', {
			defaults: {
				id: 0,
				link: '',
				style: ''
			},
			relations: [
				{
					type: 'HasOne',
					key: 'image',
					relatedModel: this.AddImage
				}
			]
		});
		this.Adds = this.create('Adds', {
			defaults: {
				id: 0
			},
			relations: [
				{
					type: 'HasOne',
					key: 'header',
					relatedModel: this.AddZone
				},
				{
					type: 'HasOne',
					key: 'bar',
					relatedModel: this.AddZone
				},
				{
					type: 'HasOne',
					key: 'power',
					relatedModel: this.AddZone
				},
				{
					type: 'HasOne',
					key: 'footer',
					relatedModel: this.AddZone
				}
			]
		});

		this.NavOpt = this.create('NavOpt', {
			defaults: {
				id: 0,
				name: '',
				list: [],
				listDefault: 0,
				badges: 0,
				default: 1
			}
		});
		this.Nav = this.create('Nav', {
			defaults: {
				id: 0,
				tournaments: []
			},
			relations: [
				{
					type: 'HasMany',
					key: 'opts',
					relatedModel: this.NavOpt
				}
			]
		});
*/
	});

if( typeof module != 'undefined' )
	module.exports = models;
