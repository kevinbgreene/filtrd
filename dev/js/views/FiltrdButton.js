injekter.define('FiltrdButton', ['eventHub', function(eventHub) {

	'use strict';

	function FiltrdButton(filter) {

		this.$el = this.template(filter.value);

		this.filter = filter;

		this.isSelected = false;
		this.isInactive = true;
		this.isHidden = false;
		
		this.init.call(this);
	}

	FiltrdButton.prototype = {

		constructor : FiltrdButton,

		/**
		* The filter associated with this button
		*
		* @property filter
		* @type Object
		* @default null
		*/
		filter : null,

		/**
		* Is this filter currently selected
		*
		* @property isSelected
		* @type Boolean
		* @default false
		*/
		isSelected : false,

		/**
		* Is this filter able to be selected.
		*
		* @property isInactive
		* @type Boolean
		* @default false
		*/
		isInactive : false,

		/**
		* 
		*
		* @property isHidden
		* @type Boolean
		* @default false
		*/
		isHidden : false,

		/**
		* Renders markup for this button
		*
		* @method template
		* @param {String} value
		*/
		template : function(value) {

			return $('<div class="filtrd-button">' +
						'<div class="filter-indicator">' +
							'<div class="filter-indicator-inner"></div>' +
						'</div><p>' + value + '</p>' +
					 '</div>');
		},

		init : function() {
			
			this.on();

			eventHub.on('row.change', this.handleRowChange, this);
		},

		handleButtonClick : function(evt) {

			evt.preventDefault();
			evt.stopPropagation();

			if (!this.isInactive && this.isSelected) {
				this.remove();
			}
			else if (!this.isInactive) {
				this.apply();
			}
		},

		/**
		* Apply the filter associated with this button and apply the
		* appropriate styles.
		*
		* @method apply
		*/
		apply : function() {
			
			if (!this.isSelected) {
				this.$el.addClass('i_active');
				this.isSelected = true;
				eventHub.emit('filter.apply', this.filter);
			}
		},

		/**
		* Remove the filter associated with this button and apply the
		* appropriate styles.
		*
		* @method remove
		*/
		remove : function() {

			if (this.isSelected) {
				this.$el.removeClass('i_active');
				this.isSelected = false;
				eventHub.emit('filter.remove', this.filter);
			}
		},

		/**
		* Checks the current active filters and hides/shows this button
		* in response to whether it is still active or not.
		*
		* @method handleRowChange
		* @param {Object} evt an object containing an array of active rows and
		* an integer representing the total number of rows.
		*/
		handleRowChange : function(evt) {

			var i = 0;
			var rows = evt.activeRows;
			var len = rows.length;
			var shouldShow = false;

			if (len === evt.total || len === 0) {
				shouldShow = true;
			}
			else {

				rows.each(function(row) {

					if (row.hasFilter(this.filter)) {

						shouldShow = true;
						return false;		
					}

				}, this);
			}

			if (shouldShow) {
				this.setActive();
			}
			else {
				this.setInactive();
			}
		},

		/**
		* Set the state so that this button can receive clicks.
		*
		* @method setActive
		*/
		setActive : function() {

			if (this.isInactive) {
				this.isInactive = false;
				this.$el.removeClass('filter_inactive');
				eventHub.emit('button.active', this);
			}
		},

		/**
		* Set the state so that this button cannot receive clicks.
		*
		* @method setInactive
		*/
		setInactive : function() {

			if (!this.isInactive) {
				this.isInactive = true;
				this.$el.addClass('filter_inactive');
				eventHub.emit('button.inactive', this);
			}
		},

		/**
		* If the button is active, show it
		*
		* @method show
		*/
		show : function() {
			this.isHidden = false;
			this._show();
		},

		/**
		* Hide the button
		*
		* @method hide
		*/
		hide : function() {
			this.isHidden = true;
			this._hide();
		},

		/**
		* Remove DOM event listeners
		*
		* @method off
		*/
		off : function() {
			this.$el.off();
		},

		/**
		* Add DOM event listeners
		*
		* @method on
		*/
		on : function() {
			this.$el.on('click', this.handleButtonClick.bind(this));
		},

		/**
		* Checks if the filters from the given row match the filter for 
		* this button.
		*
		* @private
		* @method _checkRow
		* @param {Object} row - row to check
		* @return {Boolean} - do any of the filters from this row match
		* the filter for this button
		*/
		_checkRow : function(row) {

			var temp = false;

			row.filters.each(function(filter) {

				if (this._matches(filter)) {
					temp = true;
					return false;
				}
			}, this);

			return false;
		},

		/**
		* Checks if the given filter matches the filter for this button
		*
		* @private
		* @method _matches
		* @param {Object} filter - filter to check
		* @return {Boolean} - does the filter match?
		*/
		_matches : function(filter) {

			if (this.filter.index === filter.index &&
				this.filter.value === filter.value) {

				return true;
			}

			return false;
		},

		/**
		*
		* @private
		* @method _show
		*/
		_show : function() {
			this.$el.removeClass('filter_hidden');
		},

		/**
		*
		* @private
		* @method _hide
		*/
		_hide : function() {
			this.$el.addClass('filter_hidden');
		}
	};

	return FiltrdButton;
}]);