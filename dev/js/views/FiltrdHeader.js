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
		*/
		parseFilterKeys : function() {

			var counter = 0;
			var keys = [];
			var length = 0;
			var temp = null;

			temp = this.$el.find('.filtrd-filter');
			
			temp.each(function() {

				keys.push({
					index : counter,
					key : $(this).text()
				});

				counter = counter + 1;
			});

			return keys;
		}
	};

	return FiltrdHeader;

}]);