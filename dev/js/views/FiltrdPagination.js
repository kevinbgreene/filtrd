injekter.define('FiltrdPagination', ['eventHub', function(eventHub) {

	'use strict';

	function FiltrdPagination(options) {

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

		/**
		* 
		*
		* @property currentIndex
		* @type Number
		* @default 0
		*/
		currentIndex : 0,

		/**
		* 
		*
		* @property numPages
		* @type Number
		* @default 0
		*/
		numPages : 0,

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

			this.tearDown();

			this.allRows = evt.activeRows;

			if (this.allRows.length > this.pageLimit) {
				this.setupPages();
			}

			this.updateDisplay();
		},

		/**
		* 
		*
		* @method setupPages
		*/
		setupPages : function() {

			var self = this;

			this.numPages = Math.ceil(this.allRows.length / this.pageLimit);

			this.hasPrevious = false;

			this.$buttonBar = this.template();

			// used for user navigation.
			self.$filterInfo = this.$buttonBar.find('.filtrd-info');
			this.$nextButton = this.$buttonBar.find('[class*="_next"]');
			this.$prevButton = this.$buttonBar.find('[class*="_previous"]');

			this.$el.append(this.$buttonBar);

			this.$nextButton.on('click', function(evt) {

				evt.preventDefault();
				evt.stopPropagation();

				if (self.hasNext) {
					self.getNextPage();
				}
			});

			this.$prevButton.on('click', function(evt) {

				evt.preventDefault();
				evt.stopPropagation();
				
				if (self.hasPrevious) {
					self.getPrevPage();
				}
			});

			this.updateState();
		},

		/**
		* 
		*
		* @method updateDisplay
		*/
		updateDisplay : function() {

			var i = 0;
			var start = this.currentIndex * this.pageLimit;
			var end = start + this.pageLimit;
			var len = this.allRows.length;

			if (end > len) {
				end = len;
			}

			this.allRows.each(function(row, index) {

				row.hide();
			
			}, this);

			for (i=start;i<end;i++) {

				this.allRows.get(i).show();
			}

			if (len > this.pageLimit) {

				this.updateData({
					start : start,
					end : end,
					total : this.allRows.length
				});

				this.updateState();
			}
		},

		/**
		* 
		*
		* @method updateData
		*/
		updateData : function(data) {

			var self = this;

			// changing display hacks around an annoyance when the display will sometimes not update.
			self.$filterInfo.css({
				display : 'none'
			});

			self.$filterInfo.html('Items ' + data.start + ' - ' + data.end + ' of ' + data.total);

			setTimeout(function() {

				self.$filterInfo.css({
					display : 'block'
				});

			}, 0);
		},

		/**
		* 
		*
		* @method updateState
		*/
		updateState : function() {

			if (this.currentIndex > 0) {
				this.hasPrevious = true;
			}
			else {
				this.hasPrevious = false;
			}

			if (this.currentIndex < this.numPages - 1) {
				this.hasNext = true;
			}
			else {
				this.hasNext = false;
			}

			if (this.hasPrevious) {
				this.$prevButton
					.removeClass('paginate_disabled_previous')
					.addClass('paginate_previous');
			}
			else {
				this.$prevButton
					.removeClass('paginate_previous')
					.addClass('paginate_disabled_previous');
			}

			if (this.hasNext) {
				this.$nextButton
					.removeClass('paginate_disabled_next')
					.addClass('paginate_next');
			}
			else {
				this.$nextButton
					.removeClass('paginate_next')
					.addClass('paginate_disabled_next');
			}
		},

		/**
		* 
		*
		* @method getNextPage
		*/
		getNextPage : function() {

			this.currentIndex++;

			this.updateDisplay();
		},

		/**
		* 
		*
		* @method getPrevPage
		*/
		getPrevPage : function() {

			this.currentIndex--;

			this.updateDisplay();
		},

		/**
		* 
		*
		* @method tearDown
		*/
		tearDown : function() {

			this.allRows = [];
			this.currentIndex = 0;
			this.hasPrevious = false;
			this.hasNext = false;

			if (this.$buttonBar) {

				this.$nextButton.off();
				this.$prevButton.off();

				this.$buttonBar.remove();
				this.$buttonBar = null;
				this.$nextButton = null;
				this.$prevButton = null;
				this.$filterInfo = null;
			}
		}
	};

	return FiltrdPagination;

}]);