injekter.run([ "eventHub", "FiltrdTable", "FiltrdMenu", "filtrdRules", "FiltrdStack", "FiltrdPagination" ], function(eventHub, FiltrdTable, FiltrdMenu, filtrdRules, FiltrdStack, FiltrdPagination) {
    "use strict";
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
    filtrdRules.loadRules().then(function(rules) {
        filterRules = rules;
        filterMenu = new FiltrdMenu({
            element: $(".filtrd-menu")[0],
            rules: filterRules
        });
        filterTable = new FiltrdTable({
            element: $(".filtrd-table")[0]
        });
        filterPagination = new FiltrdPagination({
            element: $(".filtrd-table")[0]
        });
        return filterTable.getFiltersAndRows();
    }).then(function(obj) {
        var key = null;
        // add rows and filters to appropriate stacks.
        filters.push(obj.filters);
        rows.push(obj.rows);
        // group filters by key.
        divideFiltersIntoCollections(filters);
        // alert listeners of the new collections.
        for (key in filterCollections) {
            eventHub.emit("collection.ready", filterCollections[key]);
        }
        eventHub.on("filter.apply", function(filter) {
            var length = appliedSupers.length;
            if (appliedFilters.push(filter)) {
                if (filter.isSuper) {
                    appliedSupers.push(filter);
                    if (length === 0) {
                        eventHub.emit("super.applied");
                    }
                }
                eventHub.emit("filter.applied", appliedFilters);
            }
        });
        eventHub.on("filter.remove", function(filter) {
            if (appliedFilters.remove(filter)) {
                if (filter.isSuper) {
                    appliedSupers.remove(filter);
                }
                if (filterRules && filterRules.super && appliedSupers.length === 0) {
                    eventHub.emit("super.removed");
                }
                eventHub.emit("filter.removed", appliedFilters);
            }
        });
        eventHub.on("row.active", function(row) {
            if (activeRows.push(row)) {
                eventHub.delay("row.change", {
                    activeRows: activeRows,
                    total: rows.length
                }, true);
            }
        });
        eventHub.on("row.inactive", function(row) {
            if (activeRows.remove(row)) {
                eventHub.delay("row.change", {
                    activeRows: activeRows,
                    total: rows.length
                }, true);
            }
        });
        eventHub.emit("filter.applied", []);
        // if we have filter rules we need to notify relevant modules what
        // rules they need to display with.
        if (filterRules) {
            // priority rules are for sorting display order of filter sets.
            if (filterRules.priority) {
                eventHub.emit("sets.sort", function(a, b) {
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
                    } else if (indexA < indexB) {
                        return -1;
                    }
                    return 0;
                });
            }
            // super filters affect the visibility of non-super filter sets.
            // since at application start-up no filters are applied by default,
            // alert all sets that no super filters are applied.
            if (filterRules.super) {
                eventHub.emit("super.removed");
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
            if (filterRules && filterRules.super && filterRules.super.indexOf(key) > -1) {
                filter.isSuper = true;
                filterCollections[key].isSuper = true;
            }
            // add the filter to the appropriate collection.
            filterCollections[key].push(filter);
        });
    }
});

/**
* @name Messenger
* @author Kevin Greene
*/
injekter.define("eventHub", [ "injekter.utils", function(utils) {
    "use strict";
    /**
	* @class Messenger
	* @description handles app-wide messaging between components
	*/
    var Messenger = function() {
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
            var obj = null;
            var i = 0;
            var len = 0;
            if (!messages[name]) {
                messages[name] = [];
            }
            for (i = 0, len = messages[name].length; i < len; i++) {
                obj = messages[name][i];
                if (obj.fn === fn && obj.ctx === ctx) {
                    shouldAdd = false;
                    break;
                }
            }
            if (shouldAdd) {
                messages[name].push({
                    fn: fn,
                    ctx: ctx
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
            if (typeof name === "undefined") {
                if (messages[name]) {
                    if (typeof fn === "undefined") {
                        delete messages[name];
                        return;
                    }
                    for (i = 0, len = messages[name].length; i < len; i++) {
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
            for (i = 0; i < len; i++) {
                if (overwrite && eventQueue[i].name === name) {
                    eventQueue[i].data = data;
                    return;
                }
                if (eventQueue[i].name === name && eventQueue[i].data === data) {
                    return;
                }
            }
            eventQueue.push({
                name: name,
                data: data
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
            } else {
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
            } else {
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
                    if (typeof fn === "function") {
                        fn.call(ctx || window, data);
                    }
                });
            } else {
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
    }();
    return Messenger;
} ]);

injekter.define("logger", [ "eventHub", function(eventHub) {
    "use strict";
    eventHub.on("LOG", function(evt) {
        var msg;
        if (typeof console !== "undefined") {
            switch (evt.severity) {
              case "error":
                msg = "ERROR: " + evt.msg;
                break;

              case "warn":
                msg = "WARN: " + evt.msg;
                break;

              default:
                msg = "LOG: " + evt.msg;
                break;
            }
            console.log(msg, evt.data);
        }
    });
} ]);

injekter.define("FiltrdStack", [ "injekter.utils", function(utils) {
    "use strict";
    function FiltrdStack() {
        this.store = [];
    }
    FiltrdStack.prototype = {
        constructor: FiltrdStack,
        /**
		* An array in which to store objects.
		*
		* @property store
		*/
        store: [],
        /**
		* The number of objects in the store.
		*
		* @property length
		*/
        length: 0,
        /**
		* A reference to the last object added to the store.
		*
		* @property lastAdded
		*/
        lastAdded: null,
        /**
		* 
		*
		* @method get
		* @param {Number} index
		*/
        get: function(index) {
            return this.store[index] || null;
        },
        /**
		* 
		*
		* @method push
		* @param {Object} obj Filter or Row to add to the stack.
		*/
        push: function(obj) {
            var success = false;
            if (utils.isArray(obj)) {
                for (var i = 0; i < obj.length; i++) {
                    if (this._addToStack(obj[i]) && !success) {
                        success = true;
                    }
                }
            } else {
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
        remove: function(obj) {
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
        each: function(fn, ctx) {
            var i = 0;
            var len = this.store.length;
            var r = true;
            var ctx = ctx || window;
            for (i = 0; i < len; i++) {
                if (fn.call(ctx, this.store[i], i) === false) {
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
        _addToStack: function(obj) {
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
} ]);

injekter.define("Filtr", [ function() {
    "use strict";
    function Filtr() {}
    Filtr.prototype = {
        constructor: Filtr
    };
    return Filtr;
} ]);

injekter.define("FiltrCollection", [ "eventHub", function(eventHub) {
    "use strict";
    function FiltrCollection() {
        this.title = options.title;
        this.filters = options.filters;
    }
    FiltrCollection.prototype = {
        constructor: FiltrCollection,
        get: function(index) {}
    };
    return FiltrCollection;
} ]);

injekter.define("filtrdRules", [ "eventHub", "injekter.config", function(eventHub, config) {
    "use strict";
    var rules = null;
    return {
        loadRules: function(callback) {
            var deferred = Q.defer();
            if (config.get("rules-url")) {
                $.ajax({
                    url: config.get("rules-url"),
                    dataType: "json"
                }).done(function(data) {
                    rules = data[config.get("rule-set")] || data["default"] || null;
                    deferred.resolve(rules);
                }).fail(function(err) {
                    deferred.resolve(null);
                });
            } else {
                deferred.resolve(null);
            }
            return deferred.promise;
        }
    };
} ]);

injekter.define("FiltrdMenu", [ "eventHub", "FiltrdSet", function(eventHub, FiltrdSet) {
    "use strict";
    function FiltrdMenu(options) {
        this.$el = $(options.element);
        this.sets = [];
        this.collections = {};
        this.throttle = null;
        this.init.call(this);
    }
    FiltrdMenu.prototype = {
        constructor: FiltrdMenu,
        /**
		* 
		*
		* @property $el
		* @type Object
		* @default null
		*/
        $el: null,
        /**
		* 
		*
		* @property sets
		* @type Array
		* @default []
		*/
        sets: [],
        /**
		* 
		*
		* @property collections
		* @type Object
		* @default {}
		*/
        collections: {},
        /**
		* Timer to throttle display changes
		*
		* @property throttle
		* @type Number
		* @default null
		*/
        throttle: null,
        init: function() {
            eventHub.on("window.resize", this.handleResize, this);
            eventHub.on("collection.ready", this.handleNewFilterCollection, this);
            eventHub.on("super.applied", this.handleSuperApplied, this);
            eventHub.on("super.removed", this.handleSuperRemoved, this);
            eventHub.on("sets.sort", this.sort, this);
        },
        /**
		* 
		*
		* @method handleNewFilterCollection
		* @param {Object} collection FiltrdStack an array-like object containing
		* the new filters.
		*/
        handleNewFilterCollection: function(collection) {
            var self = this;
            var newSet = new FiltrdSet(collection);
            this.sets.push(newSet);
            this.$el.append(newSet.$el);
        },
        /**
		* Sort the order in which sets are displayed based on the function passed in.
		*
		* @method sort
		* @param {Function} fn Function used to sort entreis
		*/
        sort: function(fn) {
            var self = this;
            var tempSet = null;
            var len = this.sets.length;
            var i = 0;
            var priority = null;
            for (i = 0; i < len; i++) {
                this.sets[i].$el.remove();
            }
            this.sets.sort(fn);
            for (i = 0; i < len; i++) {
                this.$el.append(this.sets[i].$el);
            }
            this._handleResize();
        },
        /**
		* Handle window resizes and update the display accordingly.
		* 
		* @private
		* @method _handleResize
		* @param {Object} [evt]
		*/
        _handleResize: function(evt) {
            if ($(window).width() <= 768) {
                this._setMobileDisplay();
            } else {
                this._setDesktopDisplay();
            }
        },
        /**
		* 
		* 
		* @private
		* @method _setMobileDisplay
		*/
        _setMobileDisplay: function() {
            var i = 0;
            var len = this.sets.length;
            for (i = 0; i < len; i++) {
                this.sets[i].setMobile();
            }
            this.isMobile = true;
        },
        /**
		* 
		* 
		* @private
		* @method _setDesktopDisplay
		*/
        _setDesktopDisplay: function() {
            var i = 0;
            var len = this.sets.length;
            for (i = 0; i < len; i++) {
                this.sets[i].setDesktop();
            }
            this.isMobile = false;
        },
        /**
		* 
		* @private
		* @method _getSetForKey
		* @param {String} key
		*/
        _getSetForKey: function(key) {
            var i = 0;
            var len = this.sets.length;
            for (i = 0; i < len; i++) {
                if (this.sets[i].title === key) {
                    return this.sets[i];
                }
            }
            return null;
        }
    };
    return FiltrdMenu;
} ]);

/**

field is an integer index of the field to sort on.
fn is a function used to sort
sort : function(field, fn) {

}

*/
injekter.define("FiltrdTable", [ "eventHub", "FiltrdHeader", "FiltrdRow", function(eventHub, FiltrdHeader, FiltrdRow) {
    "use strict";
    function FiltrdTable(options) {
        this.$el = $(options.element);
        this.scope = options.scope;
        this.header = null;
        this.rows = [];
        this.init.call(this);
    }
    FiltrdTable.prototype = {
        constructor: FiltrdTable,
        init: function() {
            eventHub.on("header.sort", this.sort, this);
            return this;
        },
        /**
		* 
		*
		* @method getFiltersAndRows
		*/
        getFiltersAndRows: function() {
            var self = this;
            var deferred = Q.defer();
            // get the filter keys
            this.getFilterKeys().then(this.getFilterValues.bind(this)).done(function(filters) {
                deferred.resolve({
                    filters: filters,
                    rows: self.rows
                });
            });
            return deferred.promise;
        },
        /**
		* 
		*
		* @method getFilterKeys
		*/
        getFilterKeys: function() {
            var deferred = Q.defer();
            this.parseHeader();
            this.header.parseFilterKeys(function(keys) {
                deferred.resolve(keys);
            });
            return deferred.promise;
        },
        /**
		* Parses filtrd rows and pulls out the values for the filters. Parsing
		* filter values is perforemed in an async fashion so we wait for all of
		* the filters to be parsed before emittig the complete event.
		*
		* @method getFilterValues
		*/
        getFilterValues: function(keys) {
            var deferred = Q.defer();
            var self = this;
            var counter = 0;
            var length = 0;
            var filters = [];
            this.parseRows();
            length = this.rows.length;
            this.rows.forEach(function(row) {
                row.parseFilterValues(function(newFilters) {
                    newFilters.each(function(filter) {
                        filter.key = keys[filter.index].key;
                        if (!self._hasFilter(filter, filters)) {
                            filters.push(filter);
                        }
                    });
                    counter = counter + 1;
                    if (counter >= length) {
                        deferred.resolve(filters);
                    }
                });
            });
            return deferred.promise;
        },
        /**
		* 
		*
		* @method parseHeader
		*/
        parseHeader: function() {
            this.header = new FiltrdHeader({
                element: this.$el.find(".filtrd-header")[0]
            });
        },
        /**
		* 
		*
		* @method parseRows
		*/
        parseRows: function() {
            var self = this;
            this.$el.find(".filtrd-row").each(function() {
                self.rows.push(new FiltrdRow({
                    element: this
                }));
            });
        },
        /**
		* Sort the rows in the table based on a given cell index and
		* a function to sort with
		*
		* @method sort
		* @param {Number} index integer index of table cell to
		* sort on
		* @param {Function} fn function used to sort table
		*/
        sort: function(index, fn) {},
        /**
		* 
		* @private
		* @method hasFilter
		* @param {Object} filter
		* @param {Array} arr
		*/
        _hasFilter: function(filter, arr) {
            var i = 0;
            var len = arr.length;
            for (i = 0; i < len; i++) {
                if (this._matches(arr[i], filter)) {
                    return true;
                }
            }
            return false;
        },
        /**
		* 
		* @private
		* @method matches
		* @param {Object} filter1
		* @param {Object} filter2
		*/
        _matches: function(filter1, filter2) {
            if (filter1.index === filter2.index && filter1.value === filter2.value && filter1.key === filter2.key) {
                return true;
            }
            return false;
        }
    };
    return FiltrdTable;
} ]);

injekter.define("FiltrdRow", [ "eventHub", "FiltrdStack", function(eventHub, FiltrdStack) {
    "use strict";
    function FiltrdRow(options) {
        this.$el = $(options.element);
        this.isActive = false;
        this.isHidden = false;
        this.isAnimating = false;
        this.filters = new FiltrdStack();
        this.columns = [];
        this.init.call(this);
    }
    FiltrdRow.prototype = {
        constructor: FiltrdRow,
        /**
		* Does the row match the selected filters
		*
		* @property isActive
		* @type Boolean
		* @default false
		*/
        isActive: false,
        /**
		* Is the row active but hidden
		*
		* @property isHidden
		* @type Boolean
		* @default false
		*/
        isHidden: false,
        /**
		* 
		*
		* @property isAnimating
		* @type Boolean
		* @default false
		*/
        isAnimating: false,
        /**
		* FiltrdStack object representing all filters applying to this row.
		*
		* @property filters
		* @type Object
		* @default null
		*/
        filters: null,
        /**
		* 
		*
		* @property columns
		* @type Array
		* @default []
		*/
        columns: [],
        init: function() {
            eventHub.on([ "filter.applied", "filter.removed" ], this.handleFilterChange, this);
            return this;
        },
        /**
		* 
		*
		* @method handleFilterChange
		* @param {Object} filters array-like object of applied filters
		*/
        handleFilterChange: function(filters) {
            var i = 0;
            var len = filters.length;
            var isActive = true;
            for (i = 0; i < len; i++) {
                if (!this.hasFilter(filters.get(i))) {
                    isActive = false;
                }
            }
            if (!isActive) {
                this.setInactive();
            } else {
                this.setActive();
            }
        },
        /**
		* 
		*
		* @async
		* @method parseFilterValues
		* @param {Function} callback
		*/
        parseFilterValues: function(callback) {
            var self = this;
            var counter = 0;
            var length = 0;
            var temp = [];
            var filter = null;
            temp = this.$el.find(".filtrd-filter");
            length = temp.length;
            function checkFilter(filter) {
                var $filter = $(filter);
                var next = null;
                var len = 0;
                var values = [];
                var i = 0;
                if ($filter.text() && $filter.text() !== " ") {
                    values = $filter.text().split("|");
                    len = values.length;
                    for (i = 0; i < len; i++) {
                        filter = {
                            index: counter,
                            value: values[i].trim()
                        };
                        self.filters.push(filter);
                    }
                }
                counter = counter + 1;
                if (counter < length) {
                    next = temp.eq(counter);
                    setTimeout(function() {
                        checkFilter(next);
                    }, 0);
                } else {
                    callback(self.filters);
                }
            }
            if (length > 0) {
                checkFilter(temp.eq(counter));
            }
        },
        /**
		* 
		*
		* @method hasFilter
		* @param {Object} filter
		*/
        hasFilter: function(filterToCheck) {
            var temp = false;
            this.filters.each(function(filter, index) {
                if (filterToCheck.index === filter.index && filterToCheck.value === filter.value) {
                    temp = true;
                    return false;
                }
            });
            return temp;
        },
        /**
		* Shows the row when it matches the selected filters.
		*
		* @method setActive
		*/
        setActive: function() {
            if (!this.isActive) {
                this.isActive = true;
                this.$el.removeClass("row_inactive");
                eventHub.delay("row.active", this);
            }
        },
        /**
		* Hides the row because it doesn't match any selected filters.
		*
		* @method setInactive
		*/
        setInactive: function() {
            if (this.isActive) {
                this.isActive = false;
                this.$el.addClass("row_inactive");
                eventHub.delay("row.inactive", this);
            }
        },
        /**
		* 
		*
		* @method show
		*/
        show: function() {
            if (this.isHidden) {
                this.isHidden = false;
                this.$el.removeClass("row_hidden");
            }
        },
        /**
		* 
		*
		* @method hide
		*/
        hide: function() {
            if (!this.isHidden) {
                this.isHidden = true;
                this.$el.addClass("row_hidden");
            }
        },
        /**
		* Removes the element from the DOM, sets the reference to null and removes
		* all event listenrs.
		*
		* @method destroy
		*/
        destroy: function() {
            eventHub.off([ "filter.applied", "filter.removed" ], this.handleFilterChange);
            eventHub.off([ "filters.request" ], this.parseFilterValues);
            this.$el.remove();
            this.$el = null;
        }
    };
    return FiltrdRow;
} ]);

injekter.define("FiltrdHeader", [ "eventHub", function(eventHub) {
    "use strict";
    function FiltrdHeader(options) {
        this.$el = $(options.element);
    }
    FiltrdHeader.prototype = {
        constructor: FiltrdHeader,
        /**
		* 
		*
		* @method parseFilterKeys
		* @param {Function} callback
		*/
        parseFilterKeys: function(callback) {
            var counter = 0;
            var keys = [];
            var length = 0;
            var temp = [];
            temp = this.$el.find(".filtrd-filter");
            length = temp.length;
            function checkFilter(filter) {
                var next = null;
                keys.push({
                    index: counter,
                    key: $(filter).text()
                });
                counter = counter + 1;
                if (counter < length) {
                    next = temp.eq(counter);
                    setTimeout(function() {
                        checkFilter(next);
                    }, 0);
                } else {
                    callback(keys);
                }
            }
            if (length > 0) {
                checkFilter(temp.eq(counter));
            }
        }
    };
    return FiltrdHeader;
} ]);

injekter.define("FiltrdButton", [ "eventHub", function(eventHub) {
    "use strict";
    function FiltrdButton(filter) {
        this.$el = this.template(filter.value);
        this.filter = filter;
        this.isSelected = false;
        this.isInactive = true;
        this.isHidden = false;
        this.init.call(this);
    }
    FiltrdButton.prototype = {
        constructor: FiltrdButton,
        /**
		* The filter associated with this button
		*
		* @property filter
		* @type Object
		* @default null
		*/
        filter: null,
        /**
		* Is this filter currently selected
		*
		* @property isSelected
		* @type Boolean
		* @default false
		*/
        isSelected: false,
        /**
		* Is this filter able to be selected.
		*
		* @property isInactive
		* @type Boolean
		* @default false
		*/
        isInactive: false,
        /**
		* 
		*
		* @property isHidden
		* @type Boolean
		* @default false
		*/
        isHidden: false,
        /**
		* Renders markup for this button
		*
		* @method template
		* @param {String} value
		*/
        template: function(value) {
            return $('<div class="filtrd-button">' + '<div class="filter-indicator">' + '<div class="filter-indicator-inner"></div>' + "</div><p>" + value + "</p>" + "</div>");
        },
        init: function() {
            this.on();
            eventHub.on("row.change", this.handleRowChange, this);
        },
        handleButtonClick: function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            if (!this.isInactive && this.isSelected) {
                this.remove();
            } else if (!this.isInactive) {
                this.apply();
            }
        },
        /**
		* Apply the filter associated with this button and apply the
		* appropriate styles.
		*
		* @method apply
		*/
        apply: function() {
            if (!this.isSelected) {
                this.$el.addClass("i_active");
                this.isSelected = true;
                eventHub.emit("filter.apply", this.filter);
            }
        },
        /**
		* Remove the filter associated with this button and apply the
		* appropriate styles.
		*
		* @method remove
		*/
        remove: function() {
            if (this.isSelected) {
                this.$el.removeClass("i_active");
                this.isSelected = false;
                eventHub.emit("filter.remove", this.filter);
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
        handleRowChange: function(evt) {
            var i = 0;
            var rows = evt.activeRows;
            var len = rows.length;
            var shouldShow = false;
            if (len === evt.total || len === 0) {
                shouldShow = true;
            } else {
                rows.each(function(row) {
                    if (row.hasFilter(this.filter)) {
                        shouldShow = true;
                        return false;
                    }
                }, this);
            }
            if (shouldShow) {
                this.setActive();
            } else {
                this.setInactive();
            }
        },
        /**
		* Set the state so that this button can receive clicks.
		*
		* @method setActive
		*/
        setActive: function() {
            if (this.isInactive) {
                this.isInactive = false;
                this.$el.removeClass("filter_inactive");
                eventHub.emit("button.active", this);
            }
        },
        /**
		* Set the state so that this button cannot receive clicks.
		*
		* @method setInactive
		*/
        setInactive: function() {
            if (!this.isInactive) {
                this.isInactive = true;
                this.$el.addClass("filter_inactive");
                eventHub.emit("button.inactive", this);
            }
        },
        /**
		* If the button is active, show it
		*
		* @method show
		*/
        show: function() {
            this.isHidden = false;
            this._show();
        },
        /**
		* Hide the button
		*
		* @method hide
		*/
        hide: function() {
            this.isHidden = true;
            this._hide();
        },
        /**
		* Remove DOM event listeners
		*
		* @method off
		*/
        off: function() {
            this.$el.off();
        },
        /**
		* Add DOM event listeners
		*
		* @method on
		*/
        on: function() {
            this.$el.on("click", this.handleButtonClick.bind(this));
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
        _checkRow: function(row) {
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
        _matches: function(filter) {
            if (this.filter.index === filter.index && this.filter.value === filter.value) {
                return true;
            }
            return false;
        },
        /**
		*
		* @private
		* @method _show
		*/
        _show: function() {
            this.$el.removeClass("filter_hidden");
        },
        /**
		*
		* @private
		* @method _hide
		*/
        _hide: function() {
            this.$el.addClass("filter_hidden");
        }
    };
    return FiltrdButton;
} ]);

injekter.define("FiltrdSet", [ "eventHub", "FiltrdButton", function(eventHub, FiltrdButton) {
    "use strict";
    function FiltrdSet(collection) {
        this.collection = collection;
        this.isSuper = collection.isSuper;
        this.title = collection.title;
        this.$el = this.template(this.title);
        this.$header = this.$el.find(".filter_header");
        this.$moreButton = null;
        this.showLimit = 5;
        this.defaultLimit = 5;
        this.entries = [];
        this.activeEntries = [];
        this.displayEntries = [];
        this.displayThrottle = null;
        this.isHidden = false;
        this.isActive = false;
        this.init.call(this);
    }
    FiltrdSet.prototype = {
        constructor: FiltrdSet,
        /**
		* A jQuery object representing the DOM element containing this set.
		*
		* @property $el
		* @type Object
		* @default null
		*/
        $el: null,
        /**
		* The header is the visual representation of the set title. Also clickable
		* to expand and collapse the set if the set is larger than the display limit.
		*
		* @property $header
		* @type Object
		* @default null
		*/
        $header: null,
        /**
		* The title of this set. All filters have this as the key value.
		*
		* @property title
		* @type String
		* @default ''
		*/
        title: "",
        /**
		* The collection of filters represented by this view.
		*
		* @property collection
		* @type Object
		* @default null
		*/
        collection: null,
        /**
		* Number of filter buttons to show on screen when the set is collapsed. This
		* changes depending on the state of the application.
		*
		* @property showLimit
		* @type Number
		* @default 5
		*/
        showLimit: 5,
        /**
		* The default number of buttons to show on screen when the set is collapsed.
		* This property is used to save values when the showLimit is changing.
		*
		* @property defaultLimit
		* @type Number
		* @default 5
		*/
        defaultLimit: 5,
        /**
		* 
		*
		* @property entries
		* @type Array
		* @default []
		*/
        entries: [],
        /**
		* Buttons representing filters that are currently active.
		*
		* @property activeEntries
		* @type Array
		* @default []
		*/
        activeEntries: [],
        /**
		* Buttons that are currently visible.
		*
		* @property displayEntries
		* @type Array
		* @default []
		*/
        displayEntries: [],
        /**
		* A timer to throttle display updates.
		*
		* @property displayThrottle
		* @type Number
		* @default null
		*/
        displayThrottle: null,
        /**
		* Does the set has any active filters
		*
		* @property isActive
		* @type Boolean
		* @default false
		*/
        isActive: false,
        /**
		* Is the set hidden
		*
		* @property isHidden
		* @type Boolean
		* @default false
		*/
        isHidden: false,
        /**
		* 
		*
		* @method template
		*/
        template: function(value) {
            return $('<div class="filtrd-set set_inactive">' + '<p class="filter_header red_1 bold_t u_h">' + value + "</p>" + "</div>");
        },
        /**
		* 
		*
		* @method moreBtnTemplate
		*/
        moreBtnTemplate: function() {
            return $('<p class="filtrd-more-button">[+] Show More</p>');
        },
        init: function() {
            this.addCollectionToView();
            eventHub.on("button.active", this.handleButtonActive, this);
            eventHub.on("button.inactive", this.handleButtonInactive, this);
            eventHub.on("super.applied", this.handleSuperApplied, this);
            eventHub.on("super.removed", this.handleSuperRemoved, this);
        },
        /**
		* Check if the newly active button belongs to this set. If so, make sure this
		* set is active and add the button to the array of active entries.
		*
		* @method handleButtonActive
		* @param {Object} button
		*/
        handleButtonActive: function(button) {
            var index = this.entries.indexOf(button);
            // if this button is part of this set and hasn't already been added
            // to the array of active entries, add it to the array and update the
            // display.
            if (index > -1 && this.activeEntries.indexOf(button) === -1) {
                this.activeEntries.push(button);
                this.setActive();
                this.updateDisplay();
            }
        },
        /**
		* Check if the newly inactive button belongs to this set. If so, remove it from
		* the list of active entries and, if the active entries array is left empty, set
		* this set as inactive.
		*
		* @method handleButtonInactive
		* @param {Object} button
		*/
        handleButtonInactive: function(button) {
            var index = this.activeEntries.indexOf(button);
            if (index > -1) {
                this.activeEntries.splice(index, 1);
                if (this.activeEntries.length === 0) {
                    this.setInactive();
                } else {
                    this.setActive();
                }
                this.updateDisplay();
            }
        },
        /**
		* When a super is applied all sets should be visible.
		*
		* @method handleSuperApplied
		*/
        handleSuperApplied: function() {
            this.show();
        },
        /**
		* When no supers are applied, check to see if this set is a set of
		* super filters. If not, hide it.
		*
		* @method handleSuperRemoved
		*/
        handleSuperRemoved: function() {
            if (!this.isSuper) {
                this.hide();
            }
        },
        /**
		* Adds a button for each filter in the collection
		*
		* @method addCollectionToView
		*/
        addCollectionToView: function() {
            var self = this;
            this.collection.each(function(filter) {
                self.addFilter(filter);
            });
            this.updateDisplay();
        },
        /**
		* Adds a filter to the set.
		*
		* @method addFilter
		* @param {Object} filter - filter to add to set
		*/
        addFilter: function(filter) {
            var newButton = null;
            var i = 0;
            var len = 0;
            newButton = new FiltrdButton(filter);
            this.entries.push(newButton);
            this.$el.append(newButton.$el);
        },
        /**
		* 
		*
		* @method updateDisplay
		*/
        updateDisplay: function() {
            if (this.displayThrottle) {
                clearTimeout(this.displayThrottle);
                this.displayThrottle = null;
            }
            this.displayThrottle = setTimeout(this.refreshDisplay.bind(this), 50);
        },
        /**
		* Refreshes the display after sorting has changed or a filter is added. This
		* can be expensive because it removes/adds elements to the DOM. The method
		* 'refreshButtonVisibility' handles most visibility changes with simple CSS
		* class changes.
		*
		* @method refreshDisplay
		*/
        refreshDisplay: function() {
            var i = 0;
            var len = this.entries.length;
            for (i = 0; i < len; i++) {
                this.entries[i].off();
                this.entries[i].$el.remove();
            }
            this.sort(this.entries);
            for (i = 0; i < len; i++) {
                this.$el.append(this.entries[i].$el);
                this.entries[i].on();
            }
            this.refreshButtonVisibility();
        },
        /**
		* 
		* 
		* @private
		* @method refreshButtonVisibility
		*/
        refreshButtonVisibility: function() {
            var i = 0;
            var len = this.activeEntries.length;
            var tempEntry = null;
            this.displayEntries = [];
            this.$header.off();
            if (this.moreButton) {
                this.moreButton.off();
                this.moreButton.remove();
                this.moreButton = null;
            }
            if (this.activeEntries.length > this.showLimit) {
                this.hideAllButtons();
                this.$header.on("click", this.toggle.bind(this));
                for (i = 0; i < len; i++) {
                    tempEntry = this.activeEntries[i];
                    if (this.displayEntries.length < this.showLimit) {
                        this.displayEntries.push(tempEntry);
                        tempEntry.show();
                    }
                }
                if (!this.moreButton && !this.isMobile) {
                    this.moreButton = this.moreBtnTemplate();
                    this.$el.append(this.moreButton);
                    this.moreButton.on("click", this.toggle.bind(this));
                }
            }
            if (this.isExpanded) {
                this.expand();
            }
        },
        hideAllButtons: function() {
            var i = 0;
            var len = this.entries.length;
            for (i = 0; i < len; i++) {
                this.entries[i].hide();
            }
        },
        handleButtonClick: function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            this.toggle();
        },
        /**
		* Toggles between expanded and colapsed views.
		*
		* @private
		* @method toggle
		* @param {Object} [evt] event object
		*/
        toggle: function(evt) {
            if (this.isExpanded) {
                this.colapse();
                this.isExpanded = false;
            } else {
                this.expand();
                this.isExpanded = true;
            }
        },
        /**
		* 
		*
		* @method expand
		*/
        expand: function() {
            var i = 0;
            var len1 = this.activeEntries.length;
            var len2 = this.displayEntries.length;
            for (i = 0; i < len1; i++) {
                this.activeEntries[i].show();
            }
            if (this.isMobile) {
                this.$header.html("[-] " + this.title);
            } else if (len1 > len2 && this.moreButton) {
                this.moreButton.off();
                this.moreButton.html("[-] Show Less");
                this.$el.append(this.moreButton);
                this.moreButton.on("click", this.toggle.bind(this));
            }
        },
        /**
		* 
		*
		* @method colapse
		*/
        colapse: function() {
            var i = 0;
            var len1 = this.activeEntries.length;
            var len2 = this.displayEntries.length;
            for (i = 0; i < len1; i++) {
                this.activeEntries[i].hide();
            }
            for (i = 0; i < len2; i++) {
                this.displayEntries[i].show();
            }
            if (this.isMobile) {
                this.$header.html("[+] " + this.title);
            } else if (len1 > len2 && this.moreButton) {
                this.moreButton.off();
                this.moreButton.html("[+] Show More");
                this.$el.append(this.moreButton);
                this.moreButton.on("click", this.toggle.bind(this));
            }
        },
        /**
		* Sorts an array of filter buttons based on the filter values.
		*
		* @method sort
		* @param {Array} arr array to sort
		*/
        sort: function(arr) {
            arr.sort(function(a, b) {
                var aVal = a.filter.value;
                var bVal = b.filter.value;
                if (aVal < bVal) {
                    return -1;
                } else if (aVal > bVal) {
                    return 1;
                }
                return 0;
            });
        },
        /**
		* 
		*
		* @method setMobile
		*/
        setMobile: function() {
            if (!this.isMobile) {
                this.isMobile = true;
                this.showLimit = 0;
                this.refreshButtonVisibility();
                if (!this.isExpanded) {
                    this.$header.html("[+] " + this.title);
                } else {
                    this.$header.html("[-] " + this.title);
                }
            }
        },
        /**
		* 
		*
		* @method setDesktop
		*/
        setDesktop: function() {
            if (this.isMobile) {
                this.isMobile = false;
                this.showLimit = this.defaultLimit;
                this.refreshButtonVisibility();
                this.$header.html(this.title);
            }
        },
        /**
		* 
		*
		* @method setActive
		*/
        setActive: function() {
            if (!this.isActive || this.$el.hasClass("set_inactive")) {
                this.isActive = true;
                this.$el.removeClass("set_inactive");
            }
        },
        /**
		* 
		*
		* @method setInactive
		*/
        setInactive: function() {
            if (this.isActive || !this.$el.hasClass("set_inactive")) {
                this.isActive = false;
                this.$el.addClass("set_inactive");
            }
        },
        /**
		* 
		*
		* @method setActive
		*/
        hide: function() {
            if (!this.isHidden) {
                this.isHidden = true;
                this.$el.addClass("set_hidden");
            }
        },
        /**
		* 
		*
		* @method setInactive
		*/
        show: function() {
            if (this.isHidden) {
                this.isHidden = false;
                this.$el.removeClass("set_hidden");
            }
        }
    };
    return FiltrdSet;
} ]);

injekter.define("FiltrdPagination", [ "eventHub", function(eventHub) {
    "use strict";
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
        constructor: FiltrdPagination,
        template: function() {
            return $('<div class="filtrd-pagination">' + '<div class="filtrd-info"></div>' + '<div class="filtrd-buttons">' + '<p class="paginate_disabled_previous">Previous</p>' + '<p class="paginate_disabled_next">Next</p>' + "</div>" + "</div>");
        },
        /**
		* A reference to the last object added to the store.
		*
		* @property hasNext
		* @type Boolean
		* @default false
		*/
        hasNext: false,
        /**
		* A reference to the last object added to the store.
		*
		* @property hasPrevious
		* @type Boolean
		* @default false
		*/
        hasPrevious: false,
        /**
		* A reference to the last object added to the store.
		*
		* @property currentPage
		* @type Array
		* @default []
		*/
        currentPage: [],
        /**
		* A reference to the last object added to the store.
		*
		* @property activeRows
		* @type Array
		* @default []
		*/
        activeRows: [],
        /**
		* A reference to the last object added to the store.
		*
		* @property pageLimit
		* @type Number
		* @default 12
		*/
        pageLimit: 12,
        /**
		* 
		*
		* @property currentIndex
		* @type Number
		* @default 0
		*/
        currentIndex: 0,
        /**
		* 
		*
		* @property numPages
		* @type Number
		* @default 0
		*/
        numPages: 0,
        init: function() {
            eventHub.on("row.change", this.handleRowChange, this);
        },
        /**
		* 
		*
		* @method handleRowChange
		* @param {Object} evt an object containing an array of active rows and
		* an integer representing the total number of rows.
		*/
        handleRowChange: function(evt) {
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
        setupPages: function() {
            var self = this;
            this.numPages = Math.ceil(this.allRows.length / this.pageLimit);
            this.hasPrevious = false;
            this.$buttonBar = this.template();
            // used for user navigation.
            self.$filterInfo = this.$buttonBar.find(".filtrd-info");
            this.$nextButton = this.$buttonBar.find('[class*="_next"]');
            this.$prevButton = this.$buttonBar.find('[class*="_previous"]');
            this.$el.append(this.$buttonBar);
            this.$nextButton.on("click", function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                if (self.hasNext) {
                    self.getNextPage();
                }
            });
            this.$prevButton.on("click", function(evt) {
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
        updateDisplay: function() {
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
            for (i = start; i < end; i++) {
                this.allRows.get(i).show();
            }
            if (len > this.pageLimit) {
                this.updateData({
                    start: start,
                    end: end,
                    total: this.allRows.length
                });
                this.updateState();
            }
        },
        /**
		* 
		*
		* @method updateData
		*/
        updateData: function(data) {
            var self = this;
            // changing display hacks around an annoyance when the display will sometimes not update.
            self.$filterInfo.css({
                display: "none"
            });
            self.$filterInfo.html("Items " + data.start + " - " + data.end + " of " + data.total);
            setTimeout(function() {
                self.$filterInfo.css({
                    display: "block"
                });
            }, 0);
        },
        /**
		* 
		*
		* @method updateState
		*/
        updateState: function() {
            if (this.currentIndex > 0) {
                this.hasPrevious = true;
            } else {
                this.hasPrevious = false;
            }
            if (this.currentIndex < this.numPages - 1) {
                this.hasNext = true;
            } else {
                this.hasNext = false;
            }
            if (this.hasPrevious) {
                this.$prevButton.removeClass("paginate_disabled_previous").addClass("paginate_previous");
            } else {
                this.$prevButton.removeClass("paginate_previous").addClass("paginate_disabled_previous");
            }
            if (this.hasNext) {
                this.$nextButton.removeClass("paginate_disabled_next").addClass("paginate_next");
            } else {
                this.$nextButton.removeClass("paginate_next").addClass("paginate_disabled_next");
            }
        },
        /**
		* 
		*
		* @method getNextPage
		*/
        getNextPage: function() {
            this.currentIndex++;
            this.updateDisplay();
        },
        /**
		* 
		*
		* @method getPrevPage
		*/
        getPrevPage: function() {
            this.currentIndex--;
            this.updateDisplay();
        },
        /**
		* 
		*
		* @method tearDown
		*/
        tearDown: function() {
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
} ]);