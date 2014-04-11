injekter.define('FiltrdTable', ['eventHub', 'FiltrdHeader', 'FiltrdRow', function(eventHub, FiltrdHeader, FiltrdRow) {

	'use strict';

	function FiltrdTable(options) {

		this.$el = $(options.element);

		this.header = null;
		this.rows = [];

		this.init.call(this);
	}

	FiltrdTable.prototype = {

		constructor : FiltrdTable,

		init : function() {

			eventHub.on('header.sort', this.sort, this);

			return this;
		},

		/**
		* 
		*
		* @method getFiltersAndRows
		*/
		getFiltersAndRows : function() {

			// get the filter keys
			var keys = this.getFilterKeys();
			
			// get filter values
			var filters = this.getFilterValues(keys);

			return {
				filters : filters,
				rows : this.rows
			};
		},

		/**
		* 
		*
		* @method getFilterKeys
		*/
		getFilterKeys : function() {

			this.parseHeader();

			return this.header.parseFilterKeys();
		},

		/**
		* Parses filtrd rows and pulls out the values for the filters. Parsing
		* filter values is perforemed in an async fashion so we wait for all of
		* the filters to be parsed before emittig the complete event.
		*
		* @method getFilterValues
		*/
		getFilterValues : function(keys) {

			var self = this;
			var counter = 0;
			var length = 0;

			var filters = [];

			this.parseRows();

			length = this.rows.length;

			this.rows.forEach(function(row) {

				var newFilters = row.parseFilterValues();

				newFilters.each(function(filter) {

					filter.key = keys[filter.index].key;

					if (!self._hasFilter(filter, filters)) {
						filters.push(filter);
					}
				});
			});

			return filters;
		},

		/**
		* 
		*
		* @method parseHeader
		*/
		parseHeader : function() {

			this.header = new FiltrdHeader({
				element : this.$el.find('.filtrd-header')[0]
			});
		},

		/**
		* 
		*
		* @method parseRows
		*/
		parseRows : function() {

			var self = this;

			this.$el.find('.filtrd-row').each(function() {

				self.rows.push(new FiltrdRow({
					element : this
				}));
			});
		},

		/**
		* Sort the rows in the table based on a given cell index and
		* a function to sort with
		*
		* @method sort
		* @param {Number} index integer index of table cell to
		* sort on
		* @param {Function} fn function used to sort table
		*/
		sort : function(index, fn) {

		},

		/**
		* 
		* @private
		* @method hasFilter
		* @param {Object} filter
		* @param {Array} arr
		*/
		_hasFilter : function(filter, arr) {

			var i = 0;
			var len = arr.length;

			for (i=0;i<len;i++) {

				if (this._matches(arr[i], filter)) {
					return true;
				}
			}

			return false;
		},

		/**
		* 
		* @private
		* @method matches
		* @param {Object} filter1
		* @param {Object} filter2
		*/
		_matches : function(filter1, filter2) {

			if (filter1.index === filter2.index &&
				filter1.value === filter2.value &&
				filter1.key === filter2.key) {
				return true;
			}

			return false;
		}

	};

	return FiltrdTable;

}]);