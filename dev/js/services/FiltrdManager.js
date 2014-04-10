/**

addNewFilter(newFilter) {
	
	// addfilter

	if (filtrRules) {
		
		// if is super flag as super
		// if filter.key === super.key
	}
}

applyFilter(appliedFilter) {
	
	if (filtrRules) {
	
	}
}

if rules.priority
eventHub.emit('menu-sort' {
	sortArray : rules.priority,
	fn : function to sort with
})

*/

injekter.define('filtrdManager', ['eventHub', 'FiltrdStack', function(eventHub, FiltrdStack) {

	var instance = null;

	function FiltrdManager(rules) {

		/**
		* 
		*
		* @property filters
		*/
		var keys = filtrdStack.create();
		
		/**
		* 
		*
		* @property filters
		*/
		var filters = filtrdStack.create();

		/**
		* 
		*
		* @property appliedFilters
		*/
		var appliedFilters = filtrdStack.create();

		/**
		* 
		*
		* @property activeFilters
		*/
		var activeFilters = filtrdStack.create();

		/**
		* 
		*
		* @property rows
		*/
		var rows = filtrdStack.create();

		/**
		* 
		*
		* @property activeRows
		*/
		var activeRows = filtrdStack.create();

		/**
		* 
		*
		* @function handleParsedKeys
		* @param {Object} header
		*/
		function handleParsedKeys(newKeys) {

			for(var i=0;i<newKeys.length;i++) {
				keys.push(newKeys[i]);
			}

			eventHub.emit('filters.request');
		}

		/**
		* 
		*
		* @function handleParsedFilters
		* @param {Array} newFilters
		*/
		function handleParsedFilters(newFilters) {

			var i = 0;
			var len = newFilters.length;
			var filter = null;

			for (i=0;i<len;i++) {

				filter = newFilters[i];
				filter.key = keys.get(filter.index).key;

				if (!checkIfFilterExists(filter)) {

					filters.push(filter)

					if (rules && rules.super && rules.super.indexOf(filter.key)) {
						filter.isSuper = true;
					}

					appliedFilters = [];

					eventHub.delay('filter.ready', filter);

					eventHub.delay('filter.applied', {
						filters : appliedFilters
					});
				}
			}
		}

		function registerNewFilter(newFilter) {


		}

		function applyFilter(appliedFilter) {

			appliedStack.push(appliedFilter);
		}

		function activateRow(activeRow) {


		}

		function deactiveRow(inactiveRow) {


		}

		eventHub.on('filter.apply', applyFilter);
		eventHub.on('filters.parsed', handleParsedFilters);

		eventHub.on('row.active', activateRow);
		eventHub.on('row.inactive', deactiveRow);

		eventHub.on('keys.parsed', handleParsedKeys);

		eventHub.emit('keys.request');
	}

	return {

		start : function(rules) {

			if (instance) {
				return instance;
			}

			instance = new FiltrdManager(rules);

			return instance;
		}
	};

}]);