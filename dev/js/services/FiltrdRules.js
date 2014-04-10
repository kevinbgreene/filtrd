injekter.define('filtrdRules', ['eventHub', 'injekter.config', function(eventHub, config) {

	'use strict';

	var rules = null;

	return {

		loadRules : function(callback) {

			var deferred = Q.defer();

			if (config.get('rules-url')) {
				
				$.ajax({
					url : config.get('rules-url'),
					dataType : 'json'
				})
				.done(function(data) {
					
					rules = data[config.get('category-name')] || data['default'] || null;
					
					deferred.resolve(rules);
				})
				.fail(function(err) {
					deferred.resolve(null);
				})
			}
			else {
				deferred.resolve(null);
			}

			return deferred.promise;
		}
	};
	
}]);