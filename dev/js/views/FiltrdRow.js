injekter.define('FiltrdRow', ['eventHub', 'FiltrdStack', function(eventHub, FiltrdStack) {

	'use strict';

	function FiltrdRow(options) {

		this.$el = $(options.element);

		this.isActive = false;
		this.isHidden = false;
		this.isAnimating = false;
		
		this.filters = new FiltrdStack();
		this.columns = [];

		this.init.call(this);
	}

	FiltrdRow.prototype = {

		constructor : FiltrdRow,

		/**
		* Does the row match the selected filters
		*
		* @property isActive
		* @type Boolean
		* @default false
		*/
		isActive : false,

		/**
		* Is the row active but hidden
		*
		* @property isHidden
		* @type Boolean
		* @default false
		*/
		isHidden : false,

		/**
		* 
		*
		* @property isAnimating
		* @type Boolean
		* @default false
		*/
		isAnimating : false,

		/**
		* FiltrdStack object representing all filters applying to this row.
		*
		* @property filters
		* @type Object
		* @default null
		*/
		filters : null,

		/**
		* 
		*
		* @property columns
		* @type Array
		* @default []
		*/
		columns : [],

		init : function() {

			var self = this;

			eventHub.emit('row.added', this);
			eventHub.on(['filter.applied', 'filter.removed'], this.handleFilterChange, this);

			return this;
		},

		/**
		* 
		*
		* @method handleFilterChange
		* @param {Object} filters array-like object of applied filters
		*/
		handleFilterChange : function(filters) {

			var i = 0;
			var len = filters.length;
			var isActive = true;

			for (i=0;i<len;i++) {

				if (!this.hasFilter(filters.get(i))) {
					isActive = false;
				}
			}

			if (!isActive) {
				this.setInactive();
			}
			else {
				this.setActive();
			}
		},

		/**
		* 
		*
		* @async
		* @method parseFilterValues
		* @param {Function} callback
		*/
		parseFilterValues : function(callback) {

			var self = this;
			var counter = 0;
			var length = 0;
			var temp = [];
			var filter = null;

			temp = this.$el.find('.filtrd-filter');
			length = temp.length;

			function checkFilter(filter) {

				var $filter = $(filter);
				var next = null;
				var len = 0;
				var values = [];
				var i = 0;

				if ($filter.text() && $filter.text() !== ' ') {

					values = $filter.text().split('|');
					len = values.length;

					for (i=0;i<len;i++) {

						filter = {
							index : counter,
							value : values[i].trim()
						};

						self.filters.push(filter);
					}
				}

				counter = counter + 1;

				if (counter < length) {

					next = temp.eq(counter);

					setTimeout(function() {
						checkFilter(next);
					}, 0);
				}
				else {
					callback(self.filters);
				}
			}

			if (length > 0) {
				checkFilter(temp.eq(counter));
			}
		},

		/**
		* 
		*
		* @method hasFilter
		* @param {Object} filter
		*/
		hasFilter : function(filterToCheck) {

			var temp = false;

			this.filters.each(function(filter, index) {

				if (filterToCheck.index === filter.index &&
					filterToCheck.value === filter.value) {
				
					temp = true;
					return false;
				}
			});

			return temp;
		},

		/**
		* Shows the row when it matches the selected filters.
		*
		* @method setActive
		*/
		setActive : function() {

			if (!this.isActive) {
				this.isActive = true;
				this.$el.removeClass('row_inactive');
				eventHub.delay('row.active', this);
			}
		},

		/**
		* Hides the row because it doesn't match any selected filters.
		*
		* @method setInactive
		*/
		setInactive : function() {

			if (this.isActive) {
				this.isActive = false;
				this.$el.addClass('row_inactive');
				eventHub.delay('row.inactive', this);
			}
		},

		/**
		* 
		*
		* @method show
		*/
		show : function() {

			if (this.isHidden) {
				this.isHidden = false;
				this.$el.removeClass('row_hidden');
			}
		},

		/**
		* 
		*
		* @method hide
		*/
		hide : function() {
			
			if (!this.isHidden) {
				this.isHidden = true;
				this.$el.addClass('row_hidden');
			}
		},

		/**
		* Removes the element from the DOM, sets the reference to null and removes
		* all event listenrs.
		*
		* @method destroy
		*/
		destroy : function() {

			eventHub.off(['filter.applied', 'filter.removed'], this.handleFilterChange);
			eventHub.off(['filters.request'], this.parseFilterValues);

			this.$el.remove();
			this.$el = null;
		}
	};

	return FiltrdRow;

}]);