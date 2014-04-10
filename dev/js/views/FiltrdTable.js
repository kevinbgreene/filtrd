/**

field is an integer index of the field to sort on.
fn is a function used to sort
sort : function(field, fn) {

}

*/

injekter.define('FiltrdTable', ['eventHub', 'FiltrdHeader', 'FiltrdRow', function(eventHub, FiltrdHeader, FiltrdRow) {

	'use strict';

	function FiltrdTable(options) {

		this.$el = $(options.element);
		this.scope = options.scope;

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

			var self = this;
			var deferred = Q.defer();

			// get the filter keys
			this.getFilterKeys()
			
			// get filter values
			.then(this.getFilterValues.bind(this))
			
			// resolve with filters and rows
			.done(function(filters) {

				deferred.resolve({
					filters : filters,
					rows : self.rows
				});
			});

			return deferred.promise;
		},

		/**
		* 
		*
		* @method getFilterKeys
		*/
		getFilterKeys : function() {

			var deferred = Q.defer();

			this.parseHeader();

			this.header.parseFilterKeys(function(keys) {

				deferred.resolve(keys);
			});

			return deferred.promise;
		},

		/**
		* Parses filtrd rows and pulls out the values for the filters. Parsing
		* filter values is perforemed in an async fashion so we wait for all of
		* the filters to be parsed before emittig the complete event.
		*
		* @method getFilterValues
		*/
		getFilterValues : function(keys) {

			var deferred = Q.defer();

			var self = this;
			var counter = 0;
			var length = 0;

			var filters = [];

			this.parseRows();

			length = this.rows.length;

			this.rows.forEach(function(row) {

				row.parseFilterValues(function(newFilters) {

					newFilters.each(function(filter) {

						filter.key = keys[filter.index].key;

						if (!self._hasFilter(filter, filters)) {
							filters.push(filter);
						}
					});

					counter = counter + 1;

					if (counter >= length) {

						deferred.resolve(filters);
					}
				});
			});

			return deferred.promise;
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