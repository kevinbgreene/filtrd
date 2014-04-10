injekter.define('FiltrdMenu', ['eventHub', 'FiltrdSet', function(eventHub, FiltrdSet) {

	'use strict';

	function FiltrdMenu(options) {

		this.$el = $(options.element);

		this.sets = [];
		this.collections = {};

		this.throttle = null;

		this.init.call(this);
	}

	FiltrdMenu.prototype = {

		constructor : FiltrdMenu,

		/**
		* 
		*
		* @property $el
		* @type Object
		* @default null
		*/
		$el : null,

		/**
		* 
		*
		* @property sets
		* @type Array
		* @default []
		*/
		sets : [],

		/**
		* 
		*
		* @property collections
		* @type Object
		* @default {}
		*/
		collections : {},

		/**
		* Timer to throttle display changes
		*
		* @property throttle
		* @type Number
		* @default null
		*/
		throttle : null,

		init : function() {
			eventHub.on('window.resize', this.handleResize, this);
			eventHub.on('collection.ready', this.handleNewFilterCollection, this);
			eventHub.on('super.applied', this.handleSuperApplied, this);
			eventHub.on('super.removed', this.handleSuperRemoved, this);
			eventHub.on('sets.sort', this.sort, this);
		},

		/**
		* 
		*
		* @method handleNewFilterCollection
		* @param {Object} collection FiltrdStack an array-like object containing
		* the new filters.
		*/
		handleNewFilterCollection : function(collection) {

			var self = this;
			var newSet = new FiltrdSet(collection);

			this.sets.push(newSet);

			this.$el.append(newSet.$el);
		},

		/**
		* Sort the order in which sets are displayed based on the function passed in.
		*
		* @method sort
		* @param {Function} fn Function used to sort entreis
		*/
		sort : function(fn) {

			var self = this;
			var tempSet = null;
			var len = this.sets.length;
			var i = 0;
			var priority = null;

			for (i=0;i<len;i++) {
				this.sets[i].$el.remove();
			}

			this.sets.sort(fn);

			for (i=0;i<len;i++) {
				this.$el.append(this.sets[i].$el);
			}

			this._handleResize();
		},

		/**
		* Handle window resizes and update the display accordingly.
		* 
		* @private
		* @method _handleResize
		* @param {Object} [evt]
		*/
		_handleResize : function(evt) {

			if ($(window).width() <= 768) {
				this._setMobileDisplay();
			}
			else {
				this._setDesktopDisplay();
			}
		},

		/**
		* 
		* 
		* @private
		* @method _setMobileDisplay
		*/
		_setMobileDisplay : function() {

			var i = 0;
			var len = this.sets.length;

			for (i=0;i<len;i++) {
				this.sets[i].setMobile();
			}

			this.isMobile = true;
		},

		/**
		* 
		* 
		* @private
		* @method _setDesktopDisplay
		*/
		_setDesktopDisplay : function() {

			var i = 0;
			var len = this.sets.length;

			for (i=0;i<len;i++) {
				this.sets[i].setDesktop();
			}

			this.isMobile = false;
		},

		/**
		* 
		* @private
		* @method _getSetForKey
		* @param {String} key
		*/
		_getSetForKey : function(key) {

			var i = 0;
			var len = this.sets.length;

			for (i=0;i<len;i++) {

				if (this.sets[i].title === key) {
					return this.sets[i];
				}
			}

			return null;
		}
	};

	return FiltrdMenu;

}]);