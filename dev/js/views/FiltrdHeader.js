injekter.define('FiltrdHeader', ['eventHub', function(eventHub) {

	'use strict';

	function FiltrdHeader(options) {

		this.$el = $(options.element);
	}

	FiltrdHeader.prototype = {

		constructor : FiltrdHeader,

		/**
		* 
		*
		* @method parseFilterKeys
		* @param {Function} callback
		*/
		parseFilterKeys : function(callback) {

			var counter = 0;
			var keys = [];
			var length = 0;
			var temp = [];

			temp = this.$el.find('.filtrd-filter');
			length = temp.length;

			function checkFilter(filter) {

				var next = null;

				keys.push({
					index : counter,
					key : $(filter).text()
				});

				counter = counter + 1;

				if (counter < length) {
					
					next = temp.eq(counter);

					setTimeout(function() {
						checkFilter(next);
					}, 0);
				}
				else {
					callback(keys);
				}
			}

			if (length > 0) {
				checkFilter(temp.eq(counter));
			}
		}
	};

	return FiltrdHeader;

}]);