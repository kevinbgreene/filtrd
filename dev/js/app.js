injekter.run(['eventHub', 'FiltrdTable', 'FiltrdMenu', 'filtrdRules', 'FiltrdStack', 'FiltrdPagination'], function(eventHub, FiltrdTable, FiltrdMenu, filtrdRules, FiltrdStack, FiltrdPagination) {

	'use strict';

	// rules that dictate how filters are displayed.
	// right now we support priority and super filters.
	// super filters are filters that must be selected for other filters
	// to become visible.
	var filterRules = null;

	// the menu of filter options.
	var filterMenu = null;

	// handles row pagination.
	var filterPagination = null;

	// table of data to filter based on selected filters.
	var filterTable = null;

	// filters divided into groups based on key.
	var filterCollections = {};

	// a collection of applied super filters.
	var appliedSupers = new FiltrdStack();

	// a collection of all filters.
	var filters = new FiltrdStack();

	// the collection of currently applied filters.
	var appliedFilters = new FiltrdStack();

	// all filters that still have related active rows, filters that
	// can still be applied to change the row result set.
	var activeFilters = new FiltrdStack();

	// all rows in table.
	var rows = new FiltrdStack();

	// all rows that match the applied filters.
	var activeRows = new FiltrdStack();

	// get filter rules.
	filtrdRules.loadRules()

	// after rules, get filters and rows.
	.then(function(rules) {

		filterRules = rules;

		filterMenu = new FiltrdMenu({
			element : $('.filtrd-menu')[0],
			rules : filterRules
		});

		filterTable = new FiltrdTable({
			element : $('.filtrd-table')[0]
		});

		filterPagination = new FiltrdPagination({
			element : $('.filtrd-table')[0]
		});

		return filterTable.getFiltersAndRows();
	})

	// with filters, start rest of application.
	.then(function(obj) {

		var key = null;

		// add rows and filters to appropriate stacks.
		filters.push(obj.filters);
		rows.push(obj.rows);

		// group filters by key.
		divideFiltersIntoCollections(filters);

		// alert listeners of the new collections.
		for (key in filterCollections) {
			eventHub.emit('collection.ready', filterCollections[key]);
		}

		eventHub.on('filter.apply', function(filter) {

			var length = appliedSupers.length;

			if (appliedFilters.push(filter)) {

				if (filter.isSuper) {

					appliedSupers.push(filter);

					if (length === 0) {
						eventHub.emit('super.applied');
					}
				}

				eventHub.emit('filter.applied', appliedFilters);
			}
		});

		eventHub.on('filter.remove', function(filter) {

			if (appliedFilters.remove(filter)) {

				if (filter.isSuper) {
					appliedSupers.remove(filter);
				}

				if (filterRules && 
					filterRules.super && 
					appliedSupers.length === 0) {
					
					eventHub.emit('super.removed');
				}

				eventHub.emit('filter.removed', appliedFilters);
			}
		});

		eventHub.on('row.active', function(row) {

			if (activeRows.push(row)) {

				eventHub.delay('row.change', {
					activeRows : activeRows,
					total : rows.length
				}, true);
			}
		});

		eventHub.on('row.inactive', function(row) {

			if (activeRows.remove(row)) {

				eventHub.delay('row.change', {
					activeRows : activeRows,
					total : rows.length
				}, true);
			}
		});

		eventHub.emit('filter.applied', []);

		// if we have filter rules we need to notify relevant modules what
		// rules they need to display with.
		if (filterRules) {

			// priority rules are for sorting display order of filter sets.
			if (filterRules.priority) {
				
				eventHub.emit('sets.sort', function(a, b) {

					var priority = filterRules.priority;

					var indexA = priority.indexOf(a.title);
					var indexB = priority.indexOf(b.title);

					if (indexA < 0) {
						indexA = 100;
					}

					if (indexB < 0) {
						indexB = 100;
					}

					if (indexA > indexB) {
						return 1;
					}
					else if (indexA < indexB) {
						return -1;
					}

					return 0;
				});
			}

			// super filters affect the visibility of non-super filter sets.
			// since at application start-up no filters are applied by default,
			// alert all sets that no super filters are applied.
			if (filterRules.super) {
				eventHub.emit('super.removed');
			}

		}
	});

	/**
	* Divides and groups filters by filter key. Each collection created by this function
	* becomes a FiltrdSet in the FiltrdMenu.
	* 
	* @function divideFiltersIntoCollections
	* @param {Object} filtersToDivide An array-like object of filters to divide and group
	* by filter key.
	*/
	function divideFiltersIntoCollections(filtersToDivide) {

		filtersToDivide.each(function(filter, index) {

			var key = filter.key;

			// check if there is a collection for the current filter, if not create one.
			if (!filterCollections[key]) {
				filterCollections[key] = new FiltrdStack();
				filterCollections[key].title = key;
			}

			// check if the current filter collection represents a super filter, if so
			// flag the filter and collection as being super filters.
			if (filterRules && filterRules.super.indexOf(key) > -1) {
				filter.isSuper = true;
				filterCollections[key].isSuper = true;
			}

			// add the filter to the appropriate collection.
			filterCollections[key].push(filter);
		});
	}

});