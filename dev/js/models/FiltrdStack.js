injekter.define('FiltrdStack', ['injekter.utils', function(utils) {

	'use strict';

	function FiltrdStack() {

		this.store = [];
	}

	FiltrdStack.prototype = {

		constructor : FiltrdStack,

		/**
		* An array in which to store objects.
		*
		* @property store
		*/
		store : [],

		/**
		* The number of objects in the store.
		*
		* @property length
		*/
		length : 0,

		/**
		* A reference to the last object added to the store.
		*
		* @property lastAdded
		*/
		lastAdded : null,

		/**
		* 
		*
		* @method get
		* @param {Number} index
		*/
		get : function(index) {
			return this.store[index] || null;
		},

		/**
		* 
		*
		* @method push
		* @param {Object} obj Filter or Row to add to the stack.
		*/
		push : function(obj) {

			var success = false;

			if (utils.isArray(obj)) {

				for (var i=0;i<obj.length;i++) {

					if (this._addToStack(obj[i]) && !success) {
						success = true;
					}
				}
			}
			else {
				success = this._addToStack(obj);
			}

			return success;
		},

		/**
		* 
		*
		* @method remove
		* @param {Object|Array|String|Number|Boolean} obj Object to remove from the stack
		*/
		remove : function(obj) {

			var index = this.store.indexOf(obj);

			if (index > -1) {
				this.store.splice(index, 1);
				this.length = this.store.length;
				return true;
			}

			return false;
		},

		/**
		* 
		*
		* @method each
		* @param {Function} fn Function to call for each object in the store
		* @param {Object} [ctx] A context in which to call the function, defaults
		* to the window object.
		*/
		each : function(fn, ctx) {

			var i = 0;
			var len = this.store.length;
			var r = true;
			var ctx = ctx || window;

			for (i=0;i<len;i++) {

				if(fn.call(ctx, this.store[i], i) === false) {
					return;
				}
			}
		},

		/**
		* 
		* @private
		* @method _addToStack
		* @param {Object} obj Object to add to stack
		* @return {Boolean} Indicates if an object was successfully added.
		*/
		_addToStack : function(obj) {

			var index = this.store.indexOf(obj);

			if (index === -1) {
				this.store.push(obj);
				this.lastAdded = obj;
				this.length = this.store.length;
				return true;
			}

			return false;
		}
	};

	return FiltrdStack;

}]);