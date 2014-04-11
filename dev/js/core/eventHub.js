/**
* @name Messenger
* @author Kevin Greene
*/
injekter.define('eventHub', ['injekter.utils', function(utils) {

	'use strict';

	/**
	* @class Messenger
	* @description handles app-wide messaging between components
	*/
	var Messenger = (function() {

		/**
		* Object in which to store the public API
		*
		* @private
		* @property Messenger
		* @type Object
		* @default {}
		*/
		var Messenger = {};

		/**
		* Hash of listeners organized by event name
		*
		* @private
		* @property messages
		* @type Object
		* @default {}
		*/
		var messages = {};

		/**
		* Queue of events to fire on a delay timer
		*
		* @private
		* @property messages
		* @type Object
		* @default {}
		*/
		var eventQueue = [];

		/**
		* Timer used for delaying event calls
		*
		* @private
		* @property messages
		* @type Object
		* @default {}
		*/
		var throttle = null;

		/**
		* Miliseconds to delay the throttle
		*
		* @private
		* @property eventDelay
		* @type Number
		* @default 50
		*/
		var eventDelay = 50;

		/**
		* Register listeners for a given event. Listeners will only be added if
		* they have not already been added. For a listener to be seen as already added
		* it must have the same name, callback and context as a previously added
		* listener. An event with the same name and callback but a different context
		* will be added as a new listener.
		*
		* @function registerMessage
		* @param {String} name - event name
		* @param {Object} [fn] - callback function
		* @param {Object} [ctx] - context in which to fire callback function
		*/
		function registerMessage(name, fn, ctx) {

			var shouldAdd = true;
			var ctx = ctx || window;
			var obj = null
			var i = 0;
			var len = 0;

			if (!messages[name]) {
				messages[name] = [];
			}

			for (i=0,len=messages[name].length;i<len;i++) {

				obj = messages[name][i];

				if (obj.fn === fn && obj.ctx === ctx) {
					shouldAdd = false;
					break;
				}
			}

			if (shouldAdd) {

				messages[name].push({
					fn : fn,
					ctx : ctx
				});
			}
		}

		/**
		* Removes listeners for the given event
		*
		* @removeMessage registerMessage
		* @param {String} name - event name
		* @param {Object} [fn] - callback function
		*/
		function removeMessage(name, fn) {

			var obj = null;
			var i = 0;
			var len = 0;

			if (typeof name === 'undefined') {

				if (messages[name]) {

					if (typeof fn === 'undefined') {
						delete messages[name];
						return;
					}

					for (i=0,len=messages[name].length;i<len;i++) {

						obj = messages[name][i];

						if (obj.fn === fn) {
							messages[name].splice(i, 1);
							return;
						}
					}
				}
			}
		}

		/**
		* Add events to a queue to fire once a throttle timer has expired. The
		* throttle will be reset as long as events are being added to the stack
		* before the timer fires.
		*
		* @function addToEventQueue
		* @param {string} name - event name
		* @param {object} [data] - data to be sent to callback functions
		*/
		function addToEventQueue(name, data, overwrite) {

			var i = 0;
			var len = eventQueue.length;

			for (i=0;i<len;i++) {

				if (overwrite && eventQueue[i].name === name) {
				
					eventQueue[i].data = data;

					return;
				}

				if (eventQueue[i].name === name &&
					eventQueue[i].data === data) {

					return;
				}
			}

			eventQueue.push({
				name : name,
				data : data
			});
		}

		/**
		* Adds a callback function and function context to
		* be fired on the given event.
		*
		* @method on
		* @param {String|Array} name - event name, or array on names
		* @param {Function} fn - callback function
		* @param {Object} [ctx] - context in which to execute the 
		* callback will default to the global object
		*/
		Messenger.on = function(name, fn, ctx) {

			if (utils.isArray(name)) {

				name.forEach(function(msg) {
					registerMessage(msg, fn, ctx);
				});
			}
			else {
				registerMessage(name, fn, ctx);
			}
		};

		/**
		* Remove a callback function for a given message.
		* If the callback function is not provided, all callbacks 
		* for the given event will be removed.
		*
		* @method off
		* @param {string} name - event name
		* @param {function} [fn] - callback function
		*/
		Messenger.off = function(name, fn) {

			if (utils.isArray(name)) {

				name.forEach(function(msg) {
					removeMessage(msg, fn);
				});
			}
			else {
				removeMessage(name, fn);
			}
		};

		/**
		* Broadcast the given event to all subscribers
		*
		* @method emit
		* @param {string} name - event name
		* @param {object} [data] - data to be sent to callback functions
		*/
		Messenger.emit = function(name, data) {

			if (messages[name]) {

				messages[name].forEach(function(message) {

					var fn = message.fn;
					var ctx = message.ctx;

					if (typeof fn === 'function') {
						fn.call(ctx || window, data);
					}
				});
			}
			else {
				return false;	
			}
		};

		/**
		* Broadcast the given event to all subscribers on the next event loop
		*
		* @method next
		* @param {string} name - event name
		* @param {object} [data] - data to be sent to callback functions
		*/
		Messenger.next = function(name, data) {

			setTimeout(function() {

				Messenger.emit(name, data);

			}, 0);
		};

		/**
		* Throttles the passed events against a timer
		*
		* @method delay
		* @param {string} name - event name
		* @param {object} [data] - data to be sent to callback functions
		*/
		Messenger.delay = function(name, data, overwrite) {

			if (throttle) {
				clearTimeout(throttle);
				throttle = null;
			}

			throttle = setTimeout(function() {

				var queue = eventQueue;
				eventQueue = [];

				queue.forEach(function(evt) {
					Messenger.emit(evt.name, evt.data);
				});

			}, eventDelay);

			addToEventQueue(name, data, overwrite || false);
		};

		return Messenger;

	}());

	return Messenger;
}]);