!function(window, document) {
    "use strict";
    for (var lastTime = 0, vendorPrefixes = [ "Webkit", "Moz", "ms", "Ms" ], i = 0; i < vendorPrefixes.length && !window.requestAnimationFrame; i++) window.requestAnimationFrame = window[vendorPrefixes[i] + "RequestAnimationFrame"], 
    window.cancelAnimationFrame = window[vendorPrefixes[i] + "CancelAnimationFrame"] || window[vendorPrefixes[i] + "CancelRequestAnimationFrame"];
    window.requestAnimationFrame || (window.requestAnimationFrame = function(callback) {
        var currTime = new Date().getTime(), timeToCall = Math.max(0, 16 - (currTime - lastTime)), id = window.setTimeout(function() {
            callback(currTime + timeToCall);
        }, timeToCall);
        return lastTime = currTime + timeToCall, id;
    }), window.cancelAnimationFrame || (window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    }), window.location.origin || (window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "")), 
    document.getElementsByClassName || (document.getElementsByClassName = function(match) {
        var elements = null, pattern = null, i = 0, results = [];
        if (document.querySelectorAll) return document.querySelectorAll("." + match);
        for (elements = document.getElementsByTagName("*"), pattern = new RegExp("(^|\\s)" + match + "(\\s|$)"), 
        i = 0; i < elements.length; i++) pattern.test(elements[i].className) && results.push(elements[i]);
        return results;
    }), Function.prototype.bind || (Function.prototype.bind = function(oThis) {
        if ("function" != typeof this) throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function() {}, fBound = function() {
            return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
        };
        return fNOP.prototype = this.prototype, fBound.prototype = new fNOP(), fBound;
    }), String.prototype.trim || (String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, "");
    }), Array.prototype.forEach || (Array.prototype.forEach = function(fun) {
        if (void 0 === this || null === this) throw new TypeError();
        var t = Object(this), len = t.length >>> 0;
        if ("function" != typeof fun) throw new TypeError();
        for (var thisArg = arguments.length >= 2 ? arguments[1] : void 0, i = 0; len > i; i++) i in t && fun.call(thisArg, t[i], i, t);
    }), Array.prototype.every || (Array.prototype.every = function(fun) {
        if (void 0 === this || null === this) throw new TypeError();
        var t = Object(this), len = t.length >>> 0;
        if ("function" != typeof fun) throw new TypeError();
        for (var thisArg = arguments.length >= 2 ? arguments[1] : void 0, i = 0; len > i; i++) if (i in t && !fun.call(thisArg, t[i], i, t)) return !1;
        return !0;
    }), Array.prototype.some || (Array.prototype.some = function(fun) {
        if (void 0 === this || null === this) throw new TypeError();
        var t = Object(this), len = t.length >>> 0;
        if ("function" != typeof fun) throw new TypeError();
        for (var thisArg = arguments.length >= 2 ? arguments[1] : void 0, i = 0; len > i; i++) if (i in t && fun.call(thisArg, t[i], i, t)) return !0;
        return !1;
    }), Array.prototype.indexOf || (Array.prototype.indexOf = function(searchElement, fromIndex) {
        if (void 0 === this || null === this) throw new TypeError('"this" is null or not defined');
        var length = this.length >>> 0;
        for (fromIndex = +fromIndex || 0, 1/0 === Math.abs(fromIndex) && (fromIndex = 0), 
        0 > fromIndex && (fromIndex += length, 0 > fromIndex && (fromIndex = 0)); length > fromIndex; fromIndex++) if (this[fromIndex] === searchElement) return fromIndex;
        return -1;
    });
}(window, window.document), injekter.run([ "eventHub", "injekter.config", "FiltrdTable", "FiltrdMenu", "filtrdRules", "FiltrdStack", "FiltrdPagination" ], function(eventHub, config, FiltrdTable, FiltrdMenu, filtrdRules, FiltrdStack, FiltrdPagination) {
    "use strict";
    function divideFiltersIntoCollections(filtersToDivide) {
        filtersToDivide.each(function(filter) {
            var key = filter.key;
            filterCollections[key] || (filterCollections[key] = new FiltrdStack(), filterCollections[key].title = key), 
            filterRules && filterRules.super.indexOf(key) > -1 && (filter.isSuper = !0, filterCollections[key].isSuper = !0), 
            filterCollections[key].push(filter);
        });
    }
    config.set("category-name", "Test"), config.set("rules-url", "json/rules.js");
    var filterRules = null, filterMenu = null, filterPagination = null, filterTable = null, filterCollections = {}, appliedSupers = new FiltrdStack(), filters = new FiltrdStack(), appliedFilters = new FiltrdStack(), rows = (new FiltrdStack(), 
    new FiltrdStack()), activeRows = new FiltrdStack();
    filtrdRules.loadRules().then(function(rules) {
        return filterRules = rules, filterMenu = new FiltrdMenu({
            element: $(".filtrd-menu")[0],
            rules: filterRules
        }), filterTable = new FiltrdTable({
            element: $(".filtrd-table")[0]
        }), filterPagination = new FiltrdPagination({
            element: $(".filtrd-table")[0]
        }), filterTable.getFiltersAndRows();
    }).then(function(obj) {
        var key = null;
        filters.push(obj.filters), rows.push(obj.rows), divideFiltersIntoCollections(filters);
        for (key in filterCollections) eventHub.emit("collection.ready", filterCollections[key]);
        eventHub.on("filter.apply", function(filter) {
            var length = appliedSupers.length;
            appliedFilters.push(filter) && (filter.isSuper && (appliedSupers.push(filter), 0 === length && eventHub.emit("super.applied")), 
            eventHub.emit("filter.applied", appliedFilters));
        }), eventHub.on("filter.remove", function(filter) {
            appliedFilters.remove(filter) && (filter.isSuper && appliedSupers.remove(filter), 
            filterRules && filterRules.super && 0 === appliedSupers.length && eventHub.emit("super.removed"), 
            eventHub.emit("filter.removed", appliedFilters));
        }), eventHub.on("row.active", function(row) {
            activeRows.push(row) && eventHub.delay("row.change", {
                activeRows: activeRows,
                total: rows.length
            }, !0);
        }), eventHub.on("row.inactive", function(row) {
            activeRows.remove(row) && eventHub.delay("row.change", {
                activeRows: activeRows,
                total: rows.length
            }, !0);
        }), eventHub.emit("filter.applied", []), filterRules && (filterRules.priority && eventHub.emit("sets.sort", function(a, b) {
            var priority = filterRules.priority, indexA = priority.indexOf(a.title), indexB = priority.indexOf(b.title);
            return 0 > indexA && (indexA = 100), 0 > indexB && (indexB = 100), indexA > indexB ? 1 : indexB > indexA ? -1 : 0;
        }), filterRules.super && eventHub.emit("super.removed"));
    });
}), injekter.define("eventHub", [ "injekter.utils", function(utils) {
    "use strict";
    var Messenger = function() {
        function registerMessage(name, fn, ctx) {
            var shouldAdd = !0, ctx = ctx || window, obj = null, i = 0, len = 0;
            for (messages[name] || (messages[name] = []), i = 0, len = messages[name].length; len > i; i++) if (obj = messages[name][i], 
            obj.fn === fn && obj.ctx === ctx) {
                shouldAdd = !1;
                break;
            }
            shouldAdd && messages[name].push({
                fn: fn,
                ctx: ctx
            });
        }
        function removeMessage(name, fn) {
            var obj = null, i = 0, len = 0;
            if ("undefined" == typeof name && messages[name]) {
                if ("undefined" == typeof fn) return void delete messages[name];
                for (i = 0, len = messages[name].length; len > i; i++) if (obj = messages[name][i], 
                obj.fn === fn) return void messages[name].splice(i, 1);
            }
        }
        function addToEventQueue(name, data, overwrite) {
            var i = 0, len = eventQueue.length;
            for (i = 0; len > i; i++) {
                if (overwrite && eventQueue[i].name === name) return void (eventQueue[i].data = data);
                if (eventQueue[i].name === name && eventQueue[i].data === data) return;
            }
            eventQueue.push({
                name: name,
                data: data
            });
        }
        var Messenger = {}, messages = {}, eventQueue = [], throttle = null, eventDelay = 50;
        return Messenger.on = function(name, fn, ctx) {
            utils.isArray(name) ? name.forEach(function(msg) {
                registerMessage(msg, fn, ctx);
            }) : registerMessage(name, fn, ctx);
        }, Messenger.off = function(name, fn) {
            utils.isArray(name) ? name.forEach(function(msg) {
                removeMessage(msg, fn);
            }) : removeMessage(name, fn);
        }, Messenger.emit = function(name, data) {
            return messages[name] ? void messages[name].forEach(function(message) {
                var fn = message.fn, ctx = message.ctx;
                "function" == typeof fn && fn.call(ctx || window, data);
            }) : !1;
        }, Messenger.next = function(name, data) {
            setTimeout(function() {
                Messenger.emit(name, data);
            }, 0);
        }, Messenger.delay = function(name, data, overwrite) {
            throttle && (clearTimeout(throttle), throttle = null), throttle = setTimeout(function() {
                var queue = eventQueue;
                eventQueue = [], queue.forEach(function(evt) {
                    Messenger.emit(evt.name, evt.data);
                });
            }, eventDelay), addToEventQueue(name, data, overwrite || !1);
        }, Messenger;
    }();
    return Messenger;
} ]), injekter.define("logger", [ "eventHub", function(eventHub) {
    "use strict";
    eventHub.on("LOG", function(evt) {
        var msg;
        if ("undefined" != typeof console) {
            switch (evt.severity) {
              case "error":
                msg = "ERROR: " + evt.msg;
                break;

              case "warn":
                msg = "WARN: " + evt.msg;
                break;

              default:
                msg = "LOG: " + evt.msg;
            }
            console.log(msg, evt.data);
        }
    });
} ]), injekter.define("FiltrdStack", [ "injekter.utils", function(utils) {
    "use strict";
    function FiltrdStack() {
        this.store = [];
    }
    return FiltrdStack.prototype = {
        constructor: FiltrdStack,
        store: [],
        length: 0,
        lastAdded: null,
        get: function(index) {
            return this.store[index] || null;
        },
        push: function(obj) {
            var success = !1;
            if (utils.isArray(obj)) for (var i = 0; i < obj.length; i++) this._addToStack(obj[i]) && !success && (success = !0); else success = this._addToStack(obj);
            return success;
        },
        remove: function(obj) {
            var index = this.store.indexOf(obj);
            return index > -1 ? (this.store.splice(index, 1), this.length = this.store.length, 
            !0) : !1;
        },
        each: function(fn, ctx) {
            var i = 0, len = this.store.length, ctx = ctx || window;
            for (i = 0; len > i; i++) if (fn.call(ctx, this.store[i], i) === !1) return;
        },
        _addToStack: function(obj) {
            var index = this.store.indexOf(obj);
            return -1 === index ? (this.store.push(obj), this.lastAdded = obj, this.length = this.store.length, 
            !0) : !1;
        }
    }, FiltrdStack;
} ]), injekter.define("Filtr", [ function() {
    "use strict";
    function Filtr() {}
    return Filtr.prototype = {
        constructor: Filtr
    }, Filtr;
} ]), injekter.define("FiltrCollection", [ "eventHub", function() {
    "use strict";
    function FiltrCollection() {
        this.title = options.title, this.filters = options.filters;
    }
    return FiltrCollection.prototype = {
        constructor: FiltrCollection,
        get: function() {}
    }, FiltrCollection;
} ]), injekter.define("filtrdRules", [ "eventHub", "injekter.config", function(eventHub, config) {
    "use strict";
    var rules = null;
    return {
        loadRules: function() {
            var deferred = Q.defer();
            return config.get("rules-url") ? $.ajax({
                url: config.get("rules-url"),
                dataType: "json"
            }).done(function(data) {
                rules = data[config.get("category-name")] || data["default"] || null, deferred.resolve(rules);
            }).fail(function() {
                deferred.resolve(null);
            }) : deferred.resolve(null), deferred.promise;
        }
    };
} ]), injekter.define("FiltrdMenu", [ "eventHub", "FiltrdSet", function(eventHub, FiltrdSet) {
    "use strict";
    function FiltrdMenu(options) {
        this.$el = $(options.element), this.sets = [], this.collections = {}, this.throttle = null, 
        this.init.call(this);
    }
    return FiltrdMenu.prototype = {
        constructor: FiltrdMenu,
        $el: null,
        sets: [],
        collections: {},
        throttle: null,
        init: function() {
            eventHub.on("window.resize", this.handleResize, this), eventHub.on("collection.ready", this.handleNewFilterCollection, this), 
            eventHub.on("super.applied", this.handleSuperApplied, this), eventHub.on("super.removed", this.handleSuperRemoved, this), 
            eventHub.on("sets.sort", this.sort, this);
        },
        handleNewFilterCollection: function(collection) {
            var newSet = new FiltrdSet(collection);
            this.sets.push(newSet), this.$el.append(newSet.$el);
        },
        sort: function(fn) {
            var len = this.sets.length, i = 0;
            for (i = 0; len > i; i++) this.sets[i].$el.remove();
            for (this.sets.sort(fn), i = 0; len > i; i++) this.$el.append(this.sets[i].$el);
            this._handleResize();
        },
        _handleResize: function() {
            $(window).width() <= 768 ? this._setMobileDisplay() : this._setDesktopDisplay();
        },
        _setMobileDisplay: function() {
            var i = 0, len = this.sets.length;
            for (i = 0; len > i; i++) this.sets[i].setMobile();
            this.isMobile = !0;
        },
        _setDesktopDisplay: function() {
            var i = 0, len = this.sets.length;
            for (i = 0; len > i; i++) this.sets[i].setDesktop();
            this.isMobile = !1;
        },
        _getSetForKey: function(key) {
            var i = 0, len = this.sets.length;
            for (i = 0; len > i; i++) if (this.sets[i].title === key) return this.sets[i];
            return null;
        }
    }, FiltrdMenu;
} ]), injekter.define("FiltrdTable", [ "eventHub", "FiltrdHeader", "FiltrdRow", function(eventHub, FiltrdHeader, FiltrdRow) {
    "use strict";
    function FiltrdTable(options) {
        this.$el = $(options.element), this.scope = options.scope, this.header = null, this.rows = [], 
        this.init.call(this);
    }
    return FiltrdTable.prototype = {
        constructor: FiltrdTable,
        init: function() {
            return eventHub.on("header.sort", this.sort, this), this;
        },
        getFiltersAndRows: function() {
            var self = this, deferred = Q.defer();
            return this.getFilterKeys().then(this.getFilterValues.bind(this)).done(function(filters) {
                deferred.resolve({
                    filters: filters,
                    rows: self.rows
                });
            }), deferred.promise;
        },
        getFilterKeys: function() {
            var deferred = Q.defer();
            return this.parseHeader(), this.header.parseFilterKeys(function(keys) {
                deferred.resolve(keys);
            }), deferred.promise;
        },
        getFilterValues: function(keys) {
            var deferred = Q.defer(), self = this, counter = 0, length = 0, filters = [];
            return this.parseRows(), length = this.rows.length, this.rows.forEach(function(row) {
                row.parseFilterValues(function(newFilters) {
                    newFilters.each(function(filter) {
                        filter.key = keys[filter.index].key, self._hasFilter(filter, filters) || filters.push(filter);
                    }), counter += 1, counter >= length && deferred.resolve(filters);
                });
            }), deferred.promise;
        },
        parseHeader: function() {
            this.header = new FiltrdHeader({
                element: this.$el.find(".filtrd-header")[0]
            });
        },
        parseRows: function() {
            var self = this;
            this.$el.find(".filtrd-row").each(function() {
                self.rows.push(new FiltrdRow({
                    element: this
                }));
            });
        },
        sort: function() {},
        _hasFilter: function(filter, arr) {
            var i = 0, len = arr.length;
            for (i = 0; len > i; i++) if (this._matches(arr[i], filter)) return !0;
            return !1;
        },
        _matches: function(filter1, filter2) {
            return filter1.index === filter2.index && filter1.value === filter2.value && filter1.key === filter2.key ? !0 : !1;
        }
    }, FiltrdTable;
} ]), injekter.define("FiltrdRow", [ "eventHub", "FiltrdStack", function(eventHub, FiltrdStack) {
    "use strict";
    function FiltrdRow(options) {
        this.$el = $(options.element), this.isActive = !1, this.isHidden = !1, this.isAnimating = !1, 
        this.filters = new FiltrdStack(), this.columns = [], this.init.call(this);
    }
    return FiltrdRow.prototype = {
        constructor: FiltrdRow,
        isActive: !1,
        isHidden: !1,
        isAnimating: !1,
        filters: null,
        columns: [],
        init: function() {
            return eventHub.emit("row.added", this), eventHub.on([ "filter.applied", "filter.removed" ], this.handleFilterChange, this), 
            this;
        },
        handleFilterChange: function(filters) {
            var i = 0, len = filters.length, isActive = !0;
            for (i = 0; len > i; i++) this.hasFilter(filters.get(i)) || (isActive = !1);
            isActive ? this.setActive() : this.setInactive();
        },
        parseFilterValues: function(callback) {
            function checkFilter(filter) {
                var $filter = $(filter), next = null, len = 0, values = [], i = 0;
                if ($filter.text() && " " !== $filter.text()) for (values = $filter.text().split("|"), 
                len = values.length, i = 0; len > i; i++) filter = {
                    index: counter,
                    value: values[i].trim()
                }, self.filters.push(filter);
                counter += 1, length > counter ? (next = temp.eq(counter), setTimeout(function() {
                    checkFilter(next);
                }, 0)) : callback(self.filters);
            }
            var self = this, counter = 0, length = 0, temp = [];
            temp = this.$el.find(".filtrd-filter"), length = temp.length, length > 0 && checkFilter(temp.eq(counter));
        },
        hasFilter: function(filterToCheck) {
            var temp = !1;
            return this.filters.each(function(filter) {
                return filterToCheck.index === filter.index && filterToCheck.value === filter.value ? (temp = !0, 
                !1) : void 0;
            }), temp;
        },
        setActive: function() {
            this.isActive || (this.isActive = !0, this.$el.removeClass("row_inactive"), eventHub.delay("row.active", this));
        },
        setInactive: function() {
            this.isActive && (this.isActive = !1, this.$el.addClass("row_inactive"), eventHub.delay("row.inactive", this));
        },
        show: function() {
            this.isHidden && (this.isHidden = !1, this.$el.removeClass("row_hidden"));
        },
        hide: function() {
            this.isHidden || (this.isHidden = !0, this.$el.addClass("row_hidden"));
        },
        destroy: function() {
            eventHub.off([ "filter.applied", "filter.removed" ], this.handleFilterChange), eventHub.off([ "filters.request" ], this.parseFilterValues), 
            this.$el.remove(), this.$el = null;
        }
    }, FiltrdRow;
} ]), injekter.define("FiltrdHeader", [ "eventHub", function() {
    "use strict";
    function FiltrdHeader(options) {
        this.$el = $(options.element);
    }
    return FiltrdHeader.prototype = {
        constructor: FiltrdHeader,
        parseFilterKeys: function(callback) {
            function checkFilter(filter) {
                var next = null;
                keys.push({
                    index: counter,
                    key: $(filter).text()
                }), counter += 1, length > counter ? (next = temp.eq(counter), setTimeout(function() {
                    checkFilter(next);
                }, 0)) : callback(keys);
            }
            var counter = 0, keys = [], length = 0, temp = [];
            temp = this.$el.find(".filtrd-filter"), length = temp.length, length > 0 && checkFilter(temp.eq(counter));
        }
    }, FiltrdHeader;
} ]), injekter.define("FiltrdButton", [ "eventHub", function(eventHub) {
    "use strict";
    function FiltrdButton(filter) {
        this.$el = this.template(filter.value), this.filter = filter, this.isSelected = !1, 
        this.isInactive = !0, this.isHidden = !1, this.init.call(this);
    }
    return FiltrdButton.prototype = {
        constructor: FiltrdButton,
        filter: null,
        isSelected: !1,
        isInactive: !1,
        isHidden: !1,
        template: function(value) {
            return $('<div class="filtrd-button"><div class="filter-indicator"><div class="filter-indicator-inner"></div></div><p>' + value + "</p></div>");
        },
        init: function() {
            this.on(), eventHub.on("row.change", this.handleRowChange, this);
        },
        handleButtonClick: function(evt) {
            evt.preventDefault(), evt.stopPropagation(), !this.isInactive && this.isSelected ? this.remove() : this.isInactive || this.apply();
        },
        apply: function() {
            this.isSelected || (this.$el.addClass("i_active"), this.isSelected = !0, eventHub.emit("filter.apply", this.filter));
        },
        remove: function() {
            this.isSelected && (this.$el.removeClass("i_active"), this.isSelected = !1, eventHub.emit("filter.remove", this.filter));
        },
        handleRowChange: function(evt) {
            var rows = evt.activeRows, len = rows.length, shouldShow = !1;
            len === evt.total || 0 === len ? shouldShow = !0 : rows.each(function(row) {
                return row.hasFilter(this.filter) ? (shouldShow = !0, !1) : void 0;
            }, this), shouldShow ? this.setActive() : this.setInactive();
        },
        setActive: function() {
            this.isInactive && (this.isInactive = !1, this.$el.removeClass("filter_inactive"), 
            eventHub.emit("button.active", this));
        },
        setInactive: function() {
            this.isInactive || (this.isInactive = !0, this.$el.addClass("filter_inactive"), 
            eventHub.emit("button.inactive", this));
        },
        show: function() {
            this.isHidden = !1, this._show();
        },
        hide: function() {
            this.isHidden = !0, this._hide();
        },
        off: function() {
            this.$el.off();
        },
        on: function() {
            this.$el.on("click", this.handleButtonClick.bind(this));
        },
        _checkRow: function(row) {
            var temp = !1;
            return row.filters.each(function(filter) {
                return this._matches(filter) ? (temp = !0, !1) : void 0;
            }, this), !1;
        },
        _matches: function(filter) {
            return this.filter.index === filter.index && this.filter.value === filter.value ? !0 : !1;
        },
        _show: function() {
            this.$el.removeClass("filter_hidden");
        },
        _hide: function() {
            this.$el.addClass("filter_hidden");
        }
    }, FiltrdButton;
} ]), injekter.define("FiltrdSet", [ "eventHub", "FiltrdButton", function(eventHub, FiltrdButton) {
    "use strict";
    function FiltrdSet(collection) {
        this.collection = collection, this.isSuper = collection.isSuper, this.title = collection.title, 
        this.$el = this.template(this.title), this.$header = this.$el.find(".filter_header"), 
        this.$moreButton = null, this.showLimit = 5, this.defaultLimit = 5, this.entries = [], 
        this.activeEntries = [], this.displayEntries = [], this.displayThrottle = null, 
        this.isHidden = !1, this.isActive = !1, this.init.call(this);
    }
    return FiltrdSet.prototype = {
        constructor: FiltrdSet,
        $el: null,
        $header: null,
        title: "",
        collection: null,
        showLimit: 5,
        defaultLimit: 5,
        entries: [],
        activeEntries: [],
        displayEntries: [],
        displayThrottle: null,
        isActive: !1,
        isHidden: !1,
        template: function(value) {
            return $('<div class="filtrd-set set_inactive"><p class="filter_header red_1 bold_t u_h">' + value + "</p></div>");
        },
        moreBtnTemplate: function() {
            return $('<p class="filtrd-more-button">[+] Show More</p>');
        },
        init: function() {
            this.addCollectionToView(), eventHub.on("button.active", this.handleButtonActive, this), 
            eventHub.on("button.inactive", this.handleButtonInactive, this), eventHub.on("super.applied", this.handleSuperApplied, this), 
            eventHub.on("super.removed", this.handleSuperRemoved, this);
        },
        handleButtonActive: function(button) {
            var index = this.entries.indexOf(button);
            index > -1 && -1 === this.activeEntries.indexOf(button) && (this.activeEntries.push(button), 
            this.setActive(), this.updateDisplay());
        },
        handleButtonInactive: function(button) {
            var index = this.activeEntries.indexOf(button);
            index > -1 && (this.activeEntries.splice(index, 1), 0 === this.activeEntries.length ? this.setInactive() : this.setActive(), 
            this.updateDisplay());
        },
        handleSuperApplied: function() {
            this.show();
        },
        handleSuperRemoved: function() {
            this.isSuper || this.hide();
        },
        addCollectionToView: function() {
            var self = this;
            this.collection.each(function(filter) {
                self.addFilter(filter);
            }), this.updateDisplay();
        },
        addFilter: function(filter) {
            var newButton = null;
            newButton = new FiltrdButton(filter), this.entries.push(newButton), this.$el.append(newButton.$el);
        },
        updateDisplay: function() {
            this.displayThrottle && (clearTimeout(this.displayThrottle), this.displayThrottle = null), 
            this.displayThrottle = setTimeout(this.refreshDisplay.bind(this), 50);
        },
        refreshDisplay: function() {
            var i = 0, len = this.entries.length;
            for (i = 0; len > i; i++) this.entries[i].off(), this.entries[i].$el.remove();
            for (this.sort(this.entries), i = 0; len > i; i++) this.$el.append(this.entries[i].$el), 
            this.entries[i].on();
            this.refreshButtonVisibility();
        },
        refreshButtonVisibility: function() {
            var i = 0, len = this.activeEntries.length, tempEntry = null;
            if (this.displayEntries = [], this.$header.off(), this.moreButton && (this.moreButton.off(), 
            this.moreButton.remove(), this.moreButton = null), this.activeEntries.length > this.showLimit) {
                for (this.hideAllButtons(), this.$header.on("click", this.toggle.bind(this)), i = 0; len > i; i++) tempEntry = this.activeEntries[i], 
                this.displayEntries.length < this.showLimit && (this.displayEntries.push(tempEntry), 
                tempEntry.show());
                this.moreButton || this.isMobile || (this.moreButton = this.moreBtnTemplate(), this.$el.append(this.moreButton), 
                this.moreButton.on("click", this.toggle.bind(this)));
            }
            this.isExpanded && this.expand();
        },
        hideAllButtons: function() {
            var i = 0, len = this.entries.length;
            for (i = 0; len > i; i++) this.entries[i].hide();
        },
        handleButtonClick: function(evt) {
            evt.preventDefault(), evt.stopPropagation(), this.toggle();
        },
        toggle: function() {
            this.isExpanded ? (this.colapse(), this.isExpanded = !1) : (this.expand(), this.isExpanded = !0);
        },
        expand: function() {
            var i = 0, len1 = this.activeEntries.length, len2 = this.displayEntries.length;
            for (i = 0; len1 > i; i++) this.activeEntries[i].show();
            this.isMobile ? this.$header.html("[-] " + this.title) : len1 > len2 && this.moreButton && (this.moreButton.off(), 
            this.moreButton.html("[-] Show Less"), this.$el.append(this.moreButton), this.moreButton.on("click", this.toggle.bind(this)));
        },
        colapse: function() {
            var i = 0, len1 = this.activeEntries.length, len2 = this.displayEntries.length;
            for (i = 0; len1 > i; i++) this.activeEntries[i].hide();
            for (i = 0; len2 > i; i++) this.displayEntries[i].show();
            this.isMobile ? this.$header.html("[+] " + this.title) : len1 > len2 && this.moreButton && (this.moreButton.off(), 
            this.moreButton.html("[+] Show More"), this.$el.append(this.moreButton), this.moreButton.on("click", this.toggle.bind(this)));
        },
        sort: function(arr) {
            arr.sort(function(a, b) {
                var aVal = a.filter.value, bVal = b.filter.value;
                return bVal > aVal ? -1 : aVal > bVal ? 1 : 0;
            });
        },
        setMobile: function() {
            this.isMobile || (this.isMobile = !0, this.showLimit = 0, this.refreshButtonVisibility(), 
            this.$header.html(this.isExpanded ? "[-] " + this.title : "[+] " + this.title));
        },
        setDesktop: function() {
            this.isMobile && (this.isMobile = !1, this.showLimit = this.defaultLimit, this.refreshButtonVisibility(), 
            this.$header.html(this.title));
        },
        setActive: function() {
            (!this.isActive || this.$el.hasClass("set_inactive")) && (this.isActive = !0, this.$el.removeClass("set_inactive"));
        },
        setInactive: function() {
            (this.isActive || !this.$el.hasClass("set_inactive")) && (this.isActive = !1, this.$el.addClass("set_inactive"));
        },
        hide: function() {
            this.isHidden || (this.isHidden = !0, this.$el.addClass("set_hidden"));
        },
        show: function() {
            this.isHidden && (this.isHidden = !1, this.$el.removeClass("set_hidden"));
        }
    }, FiltrdSet;
} ]), injekter.define("FiltrdPagination", [ "eventHub", function(eventHub) {
    "use strict";
    function FiltrdPagination(options) {
        this.$el = $(options.element), this.hasNext = !1, this.hasPrevious = !1, this.$buttonBar = null, 
        this.$nextButton = null, this.$prevButton = null, this.$filterInfo = null, this.pageLimit = 12, 
        this.currentIndex = 0, this.currentPage = [], this.allRows = [], this.init.call(this);
    }
    return FiltrdPagination.prototype = {
        constructor: FiltrdPagination,
        template: function() {
            return $('<div class="filtrd-pagination"><div class="filtrd-info"></div><div class="filtrd-buttons"><p class="paginate_disabled_previous">Previous</p><p class="paginate_disabled_next">Next</p></div></div>');
        },
        hasNext: !1,
        hasPrevious: !1,
        currentPage: [],
        activeRows: [],
        pageLimit: 12,
        currentIndex: 0,
        numPages: 0,
        init: function() {
            eventHub.on("row.change", this.handleRowChange, this);
        },
        handleRowChange: function(evt) {
            this.tearDown(), this.allRows = evt.activeRows, this.allRows.length > this.pageLimit && this.setupPages(), 
            this.updateDisplay();
        },
        setupPages: function() {
            var self = this;
            this.numPages = Math.ceil(this.allRows.length / this.pageLimit), this.hasPrevious = !1, 
            this.$buttonBar = this.template(), self.$filterInfo = this.$buttonBar.find(".filtrd-info"), 
            this.$nextButton = this.$buttonBar.find('[class*="_next"]'), this.$prevButton = this.$buttonBar.find('[class*="_previous"]'), 
            this.$el.append(this.$buttonBar), this.$nextButton.on("click", function(evt) {
                evt.preventDefault(), evt.stopPropagation(), self.hasNext && self.getNextPage();
            }), this.$prevButton.on("click", function(evt) {
                evt.preventDefault(), evt.stopPropagation(), self.hasPrevious && self.getPrevPage();
            }), this.updateState();
        },
        updateDisplay: function() {
            var i = 0, start = this.currentIndex * this.pageLimit, end = start + this.pageLimit, len = this.allRows.length;
            for (end > len && (end = len), this.allRows.each(function(row) {
                row.hide();
            }, this), i = start; end > i; i++) this.allRows.get(i).show();
            len > this.pageLimit && (this.updateData({
                start: start,
                end: end,
                total: this.allRows.length
            }), this.updateState());
        },
        updateData: function(data) {
            var self = this;
            self.$filterInfo.css({
                display: "none"
            }), self.$filterInfo.html("Items " + data.start + " - " + data.end + " of " + data.total), 
            setTimeout(function() {
                self.$filterInfo.css({
                    display: "block"
                });
            }, 0);
        },
        updateState: function() {
            this.hasPrevious = this.currentIndex > 0 ? !0 : !1, this.hasNext = this.currentIndex < this.numPages - 1 ? !0 : !1, 
            this.hasPrevious ? this.$prevButton.removeClass("paginate_disabled_previous").addClass("paginate_previous") : this.$prevButton.removeClass("paginate_previous").addClass("paginate_disabled_previous"), 
            this.hasNext ? this.$nextButton.removeClass("paginate_disabled_next").addClass("paginate_next") : this.$nextButton.removeClass("paginate_next").addClass("paginate_disabled_next");
        },
        getNextPage: function() {
            this.currentIndex++, this.updateDisplay();
        },
        getPrevPage: function() {
            this.currentIndex--, this.updateDisplay();
        },
        tearDown: function() {
            this.allRows = [], this.currentIndex = 0, this.hasPrevious = !1, this.hasNext = !1, 
            this.$buttonBar && (this.$nextButton.off(), this.$prevButton.off(), this.$buttonBar.remove(), 
            this.$buttonBar = null, this.$nextButton = null, this.$prevButton = null, this.$filterInfo = null);
        }
    }, FiltrdPagination;
} ]);