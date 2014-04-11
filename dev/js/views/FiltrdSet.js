injekter.define('FiltrdSet', ['eventHub', 'FiltrdButton', function(eventHub, FiltrdButton) {

	'use strict';

	function FiltrdSet(collection) {

		this.collection = collection;
		this.isSuper = collection.isSuper;
		this.title = collection.title;

		this.$el = this.template(this.title);
		this.$header = this.$el.find('.filter_header');
		this.$moreButton = null;

		this.showLimit = 5;
		this.defaultLimit = 5;

		this.entries = [];
		this.activeEntries = [];
		this.displayEntries = [];

		this.displayThrottle = null;

		this.isHidden = false;
		this.isActive = false;

		this.init.call(this);
	}

	FiltrdSet.prototype = {

		constructor : FiltrdSet,

		/**
		* A jQuery object representing the DOM element containing this set.
		*
		* @property $el
		* @type Object
		* @default null
		*/
		$el : null,

		/**
		* The header is the visual representation of the set title. Also clickable
		* to expand and collapse the set if the set is larger than the display limit.
		*
		* @property $header
		* @type Object
		* @default null
		*/
		$header : null,

		/**
		* The title of this set. All filters have this as the key value.
		*
		* @property title
		* @type String
		* @default ''
		*/
		title : '',

		/**
		* The collection of filters represented by this view.
		*
		* @property collection
		* @type Object
		* @default null
		*/
		collection : null,

		/**
		* Number of filter buttons to show on screen when the set is collapsed. This
		* changes depending on the state of the application.
		*
		* @property showLimit
		* @type Number
		* @default 5
		*/
		showLimit : 5,

		/**
		* The default number of buttons to show on screen when the set is collapsed.
		* This property is used to save values when the showLimit is changing.
		*
		* @property defaultLimit
		* @type Number
		* @default 5
		*/
		defaultLimit : 5,

		/**
		* 
		*
		* @property entries
		* @type Array
		* @default []
		*/
		entries : [],

		/**
		* Buttons representing filters that are currently active.
		*
		* @property activeEntries
		* @type Array
		* @default []
		*/
		activeEntries : [],

		/**
		* Buttons that are currently visible.
		*
		* @property displayEntries
		* @type Array
		* @default []
		*/
		displayEntries : [],

		/**
		* A timer to throttle display updates.
		*
		* @property displayThrottle
		* @type Number
		* @default null
		*/
		displayThrottle : null,

		/**
		* Does the set has any active filters
		*
		* @property isActive
		* @type Boolean
		* @default false
		*/
		isActive : false,

		/**
		* Is the set hidden
		*
		* @property isHidden
		* @type Boolean
		* @default false
		*/
		isHidden : false,

		/**
		* 
		*
		* @method template
		*/
		template : function(value) {

			return $('<div class="filtrd-set set_inactive">' +
						'<p class="filter_header red_1 bold_t u_h">' + value + '</p>' +
					'</div>');

		},

		/**
		* 
		*
		* @method moreBtnTemplate
		*/
		moreBtnTemplate : function() {
			return $('<p class="filtrd-more-button">[+] Show More</p>');
		},

		init : function() {

			this.addCollectionToView();

			eventHub.on('buttons.changed', this.handleButtonChange, this);
			eventHub.on('super.applied', this.handleSuperApplied, this);
			eventHub.on('super.removed', this.handleSuperRemoved, this);
		},

		/**
		* Check if the newly active button belongs to this set. If so, make sure this
		* set is active and add the button to the array of active entries.
		*
		* @method handleButtonChange
		* @param {Object} button
		*/
		handleButtonChange : function(buttons) {

			this.activeEntries = buttons[this.title] || [];

			if (!this.activeEntries || this.activeEntries.length === 0) {
				this.setInactive();
			}
			else {
				this.setActive();
			}

			this.updateDisplay();
		},

		/**
		* When a super is applied all sets should be visible.
		*
		* @method handleSuperApplied
		*/
		handleSuperApplied : function() {

			this.show();
		},

		/**
		* When no supers are applied, check to see if this set is a set of
		* super filters. If not, hide it.
		*
		* @method handleSuperRemoved
		*/
		handleSuperRemoved : function() {

			if (!this.isSuper) {
				this.hide();
			}
		},

		/**
		* Adds a button for each filter in the collection
		*
		* @method addCollectionToView
		*/
		addCollectionToView : function() {

			var self = this;

			this.collection.each(function(filter) {
				self.addFilter(filter);
			});

			this.updateDisplay();
		},

		/**
		* Adds a filter to the set.
		*
		* @method addFilter
		* @param {Object} filter - filter to add to set
		*/
		addFilter : function(filter) {

			var newButton = null;
			var i = 0;
			var len = 0;

			newButton = new FiltrdButton(filter);

			this.entries.push(newButton);

			this.$el.append(newButton.$el);
		},

		/**
		* 
		*
		* @method updateDisplay
		*/
		updateDisplay : function() {

			if (this.displayThrottle) {
				clearTimeout(this.displayThrottle);
				this.displayThrottle = null;
			}

			this.displayThrottle = setTimeout(this.refreshDisplay.bind(this), 10);
		},

		/**
		* Refreshes the display after sorting has changed or a filter is added. This
		* can be expensive because it removes/adds elements to the DOM. The method
		* 'refreshButtonVisibility' handles most visibility changes with simple CSS
		* class changes.
		*
		* @method refreshDisplay
		*/
		refreshDisplay : function() {

			var i = 0;
			var len = this.entries.length;

			for (i=0;i<len;i++) {
				this.entries[i].off();
				this.entries[i].$el.remove();
			}

			this.sort(this.entries);

			for (i=0;i<len;i++) {
				this.$el.append(this.entries[i].$el);
				this.entries[i].on();
			}

			this.refreshButtonVisibility();
		},

		/**
		* 
		* 
		* @private
		* @method refreshButtonVisibility
		*/
		refreshButtonVisibility : function() {

			var i = 0;
			var len = this.activeEntries.length || 0;
			var tempEntry = null;

			this.displayEntries = [];

			this.$header.off();

			if (this.moreButton) {
				this.moreButton.off();
				this.moreButton.remove();
				this.moreButton = null;
			}

			this.hideAllButtons();

			for (i=0;i<len;i++) {

				tempEntry = this.activeEntries.get(i);

				if (this.displayEntries.length < this.showLimit) {
					this.displayEntries.push(tempEntry);
					tempEntry.show();
				}
			}

			if (len > this.showLimit) {

				this.$header.on('click', this.toggle.bind(this));

				if (!this.moreButton && !this.isMobile) {
					this.moreButton = this.moreBtnTemplate();
					this.$el.append(this.moreButton);
					this.moreButton.on('click', this.toggle.bind(this));
				}
			}

			if (this.isExpanded) {
				this.expand();
			}
		},

		hideAllButtons : function() {

			var i = 0;
			var len = this.entries.length;

			for (i=0;i<len;i++) {
				this.entries[i].hide();
			}
		},

		handleButtonClick : function(evt) {

			evt.preventDefault();
			evt.stopPropagation();

			this.toggle();
		},

		/**
		* Toggles between expanded and colapsed views.
		*
		* @private
		* @method toggle
		* @param {Object} [evt] event object
		*/
		toggle : function(evt) {

			if (this.isExpanded) {
				this.colapse();
				this.isExpanded = false;
			}
			else {
				this.expand();
				this.isExpanded = true;
			}
		},

		/**
		* 
		*
		* @method expand
		*/
		expand : function() {

			var i = 0;
			var len1 = this.activeEntries.length;
			var len2 = this.displayEntries.length;

			for (i=0;i<len1;i++) {
				this.activeEntries.get(i).show();
			}

			if (this.isMobile) {
				this.$header.html('[-] ' + this.title);
			}
			else if (len1 > len2 && this.moreButton) {
				this.moreButton.off();
				this.moreButton.html('[-] Show Less');
				this.$el.append(this.moreButton);
				this.moreButton.on('click', this.toggle.bind(this));
			}
		},

		/**
		* 
		*
		* @method colapse
		*/
		colapse : function() {

			var i = 0;
			var len1 = this.activeEntries.length;
			var len2 = this.displayEntries.length;

			for (i=0;i<len1;i++) {
				this.activeEntries.get(i).hide();
			}

			for (i=0;i<len2;i++) {
				this.displayEntries[i].show();
			}

			if (this.isMobile) {
				this.$header.html('[+] ' + this.title);
			}
			else if (len1 > len2 && this.moreButton) {
				this.moreButton.off();
				this.moreButton.html('[+] Show More');
				this.$el.append(this.moreButton);
				this.moreButton.on('click', this.toggle.bind(this));
			}
		},

		/**
		* Sorts an array of filter buttons based on the filter values.
		*
		* @method sort
		* @param {Array} arr array to sort
		*/
		sort : function(arr) {

			arr.sort(function(a, b) {

				var aVal = a.filter.value;
				var bVal = b.filter.value;

				if (aVal < bVal) {
					return -1;
				}
				else if (aVal > bVal) {
					return 1;
				}

				return 0;
			});
		},

		/**
		* 
		*
		* @method setMobile
		*/
		setMobile : function() {

			console.log('FiltrdSet: setMobile: ' + this.title);

			if (!this.isMobile) {

				this.isMobile = true;
				this.showLimit = 0;
				this.refreshButtonVisibility();

				if (!this.isExpanded) {
					this.$header.html('[+] ' + this.title);
				}
				else {
					this.$header.html('[-] ' + this.title);
				}
			}
		},

		/**
		* 
		*
		* @method setDesktop
		*/
		setDesktop : function() {

			console.log('FiltrdSet: setDesktop: ' + this.title);

			if (this.isMobile) {
				this.isMobile = false;
				this.showLimit = this.defaultLimit;
				this.refreshButtonVisibility();
				this.$header.html(this.title);
			}
		},

		/**
		* 
		*
		* @method setActive
		*/
		setActive : function() {

			if (!this.isActive || this.$el.hasClass('set_inactive')) {
				this.isActive = true;
				this.$el.removeClass('set_inactive');
			}
		},

		/**
		* 
		*
		* @method setInactive
		*/
		setInactive : function() {

			if (this.isActive || !this.$el.hasClass('set_inactive')) {
				this.isActive = false;
				this.$el.addClass('set_inactive');
			}
		},

		/**
		* 
		*
		* @method setActive
		*/
		hide : function() {

			if (!this.isHidden) {
				this.isHidden = true;
				this.$el.addClass('set_hidden');
			}
		},

		/**
		* 
		*
		* @method setInactive
		*/
		show : function() {

			if (this.isHidden) {
				this.isHidden = false;
				this.$el.removeClass('set_hidden');
			}
		}
	};

	return FiltrdSet;

}]);