(function(window, document) {

	'use strict';

    var lastTime = 0,
        vendorPrefixes = ['Webkit', 'Moz', 'ms', 'Ms'];

    for (var i = 0; i < vendorPrefixes.length && !window.requestAnimationFrame; i++) {
        window.requestAnimationFrame = window[vendorPrefixes[i] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendorPrefixes[i] + 'CancelAnimationFrame'] || window[vendorPrefixes[i] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {

        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {

        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }

    if (!window.location.origin) {
        
        window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
    }

    if (!document.getElementsByClassName) {

        document.getElementsByClassName = function(match) {

            var elements = null,
                pattern = null,
                i = 0,
                results = [];

            if (document.querySelectorAll) { // IE8
                return document.querySelectorAll('.' + match);
            }

            elements = document.getElementsByTagName('*');
            pattern = new RegExp('(^|\\s)' + match + '(\\s|$)');
            for (i = 0; i < elements.length; i++) {
                if (pattern.test(elements[i].className)) {
                    results.push(elements[i]);
                }
            }

            return results;
        };
    }

    if (!Function.prototype.bind) {

        Function.prototype.bind = function(oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function() {},
                fBound = function() {
                    return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

    if (!String.prototype.trim) {

        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    if (!Array.prototype.forEach) {
  
  		Array.prototype.forEach = function(fun /*, thisArg */) {
    
    		"use strict";

    		if (this === void 0 || this === null) {
    			throw new TypeError();
    		}

    		var t = Object(this);
    		var len = t.length >>> 0;
    		if (typeof fun !== "function") {
    			throw new TypeError();
    		}

    		var thisArg = arguments.length >= 2 ? arguments[1] : void 0;

    		for (var i = 0; i < len; i++) {
      			if (i in t) {
      				fun.call(thisArg, t[i], i, t);
      			}
    		}
  		};
	}

    if (!Array.prototype.every) {
  		
  		Array.prototype.every = function(fun) {
    
    		'use strict';

    		if (this === void 0 || this === null) {
    			throw new TypeError();
    		}

    		var t = Object(this);
    		var len = t.length >>> 0;
    		
    		if (typeof fun !== 'function') {
    			throw new TypeError();
    		}

    		var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    		for (var i = 0; i < len; i++) {
      			if (i in t && !fun.call(thisArg, t[i], i, t)) {
        			return false;
        		}
    		}

    		return true;
  		};
	}

	if (!Array.prototype.some) {
  
  		Array.prototype.some = function(fun /*, thisArg */) {
    
    		'use strict';

    		if (this === void 0 || this === null) {
    			throw new TypeError();
    		}

    		var t = Object(this);
    		var len = t.length >>> 0;
    		if (typeof fun !== 'function') {
    			throw new TypeError();
    		}

    		var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    		for (var i = 0; i < len; i++) {
      			if (i in t && fun.call(thisArg, t[i], i, t)) {
        			return true;
        		}
    		}

    		return false;
  		};
	}

	if (!Array.prototype.indexOf) {

	    Array.prototype.indexOf = function (searchElement, fromIndex) {
	      	if ( this === undefined || this === null ) {
	        	throw new TypeError( '"this" is null or not defined' );
	      	}

	      	var length = this.length >>> 0; // Hack to convert object.length to a UInt32

	      	fromIndex = +fromIndex || 0;

	      	if (Math.abs(fromIndex) === Infinity) {
	        	fromIndex = 0;
	      	}

	      	if (fromIndex < 0) {
	        	fromIndex += length;
	        	if (fromIndex < 0) {
	          		fromIndex = 0;
	        	}
	      	}

	      	for (;fromIndex < length; fromIndex++) {
	        	if (this[fromIndex] === searchElement) {
	          		return fromIndex;
	        	}
	      	}

	      	return -1;
	    };
	}

}(window, window.document));