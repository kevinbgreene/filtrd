injekter.define('FiltrdPagination', ['eventHub', function(eventHub) {

	'use strict';

	function FiltrdPagination(options) {

		console.log('FiltrdPagination');

		this.$el = $(options.element);
		this.hasNext = false;
		this.hasPrevious = false;

		this.$buttonBar = null;
		this.$nextButton = null;
		this.$prevButton = null;
		this.$filterInfo = null;

		// max num rows per page
		this.pageLimit = 12;

		// the index of the current page
		this.currentIndex = 0;

		// if paginated, rows being dispalyed
		this.currentPage = [];

		// all rows that can be displayed
		this.allRows = [];

		this.init.call(this);
	}

	FiltrdPagination.prototype = {

		constructor : FiltrdPagination,

		template : function() {
			
			return 	$('<div class="filtrd-pagination">' +
						'<div class="filtrd-info"></div>' +
						'<div class="filtrd-buttons">' +
							'<p class="paginate_disabled_previous">Previous</p>' +
							'<p class="paginate_disabled_next">Next</p>' +
						'</div>' +
					  '</div>');
		},

		/**
		* A reference to the last object added to the store.
		*
		* @property hasNext
		* @type Boolean
		* @default false
		*/
		hasNext : false,

		/**
		* A reference to the last object added to the store.
		*
		* @property hasPrevious
		* @type Boolean
		* @default false
		*/
		hasPrevious : false,

		/**
		* A reference to the last object added to the store.
		*
		* @property currentPage
		* @type Array
		* @default []
		*/
		currentPage : [],

		/**
		* A reference to the last object added to the store.
		*
		* @property activeRows
		* @type Array
		* @default []
		*/
		activeRows : [],

		/**
		* A reference to the last object added to the store.
		*
		* @property pageLimit
		* @type Number
		* @default 12
		*/
		pageLimit : 12,

		currentIndex : 0,

		init : function() {

			eventHub.on('row.change', this.handleRowChange, this);
		},

		/**
		* 
		*
		* @method handleRowChange
		* @param {Object} evt an object containing an array of active rows and
		* an integer representing the total number of rows.
		*/
		handleRowChange : function(evt) {

			this.allRows = evt.activeRows;

			if (this.allRows.length > this.pageLimit) {

				this.$buttonBar = this.template();
				
				// used for user navigation.
				self.$nextButton = this.$buttonBar.find('[class*="_next"]');
				self.$previousButton = this.$buttonBar.find('[class*="_previous"]');
			}

			this.allRows.each(function(row, index) {

				if (index < this.pageLimit) {
					this.currentPage.push(row);
				}
				else {
					row.hide();
				}
			
			}, this);
		},

		getNextPage : function() {

		},

		getPrevPage : function() {

		}
	};

	return FiltrdPagination;

}]);