/**
 * Page controller handles the events fires to intangible in the page
 * when triggerHandler gets called,
 * $(document).triggerHandler('foo');
 * => $(document).on('foo', function (ev, caller, opt, callback)
 */
(
function ($, window, document) {
	"use strict";

	/**
	 * @param {object} opt
	 * @see [dependency] only for IEs but http://github.com/balupton/history.js
	 */
	var PageController = Meetup.PageController = function (app_name, opt, ready) {
		var self = this;

		// if the browser doesn't support native history.pushState,
		// this will fail to instantiate.  Load an appropriate history.js
		this.isNativeHistory = (history && Meetup.PageController.isFunc(history.pushState));
		if (!this.isNativeHistory && !(History && History.pushState)) {
			// very strangely, in IE8, an object that is returned in constructor
			// will be ignored, and half baked object gets returned. OMG.
			return null;
		}

		this.app_name = app_name;
		this.id = '_' + ('' + (new Date()).valueOf()).slice(-6);
		this.exports = ['query', 'onPopstate', 'attr'];
		this.url = PageController.currentPageUrl();
		this.consistent = null;
		this.collection = [];
		this.keepsHistory = true;
		this.initialQuery = null;
		this.hasQueried = false;
		this._attrs = {};
		this.callerOpt = null;
		this.cache = {};
		this.lifo = '';
		this.historyDoubleCallFlag = false;
		this.hasFiredReady = false;

		// set ready to be in the ready queue
		if (ready && 'function' === typeof ready) {
			this.ready(ready);
		}

		// find out functions to be exported to $(document) event
		// You could override this.exports to make some functions private
		$.each(
			opt,
			function (key, value) {
				if ('function' === typeof value && 'initialize' !== key && -1 === $.inArray(key, self.exports)) {
					self.exports.push(key);
				}
			}
		);
		$.extend(this, opt);
		Meetup.PageController.bindAll(this, this.exports);

		// run initialize() for controller!!
		this.initialize.apply(this, arguments);

		// History setup
		if (this.isNativeHistory) {
			$(window).bind('popstate', this.onPopstate);
		}
		else {
			History.Adapter.bind(window, 'statechange', createStatechangeFunc(this.onPopstate));
		}

		// event setup
		$.each(
			this.exports,
			function (i, name) {
				var f = self[name];
				if ('function' === typeof f) {
					$(document).on([name, self.id].join('.'), f);
				}
			}
		);

		// THIS HAS TO BE THE LAST THING.
		setTimeout(createReady(this), 1);
		return this;
	};

	/**
	 * verwrite this, if you like.
	 */
	PageController.prototype.initialize = function () {};

	PageController.prototype.invokeRender = function (isOnInit, str) {
		var hashquery, collection, _attrs;
		if (this.keepsHistory && this.initialQuery === null || isOnInit) {
			hashquery = getHashQuery(str);
			if (hashquery) {
				_attrs = this._attrs;
				collection = this.collection;
				$.each(
					collection,
					function (i, elm) {
						elm.setValue(hashquery);
					}
				);
				this.initialQuery = hashquery;
				if (this.isNativeHistory) {
					window.location.hash = '';
					history.replaceState(
						hashquery,
						['Find a Meetup: ', hashquery.keywords].join(''),
						Meetup.URL.mungeUrl(this.url, hashquery)
					);
				}
			}
			else {
				this.initialQuery = buildQueryData(this.collection);
			}
		}
		if (hashquery) {
			this.query(null, this, {noHistory: true, initialhashquery: true});
		}
		else {
			// console.log('pagetController::render by invoking');
			// $(document).triggerHandler(['render', this.id].join('.'), this.buildTriggerArg(arguments));
			this.trigger('render', isOnInit, str);
		}
	};

	/**
	 * add an element. as long as it has get/set
	 * hardly imaginable that this will be called out of
	 * context...
	 */
	PageController.prototype.produce = function (element, opts) {
		// console.log('PageController: add');
		var presentation = new Meetup.Presentation(element, opts, this);
		var index = this.collection.length;
		this.collection[index] = presentation;
		this._attrs[presentation.name] = index;
	};

	/**
	 * pass the values to the registered views. 
	 * let view handle the value.
	 * this should be used on the init, when the user passed
	 * a customized url
	 */
	PageController.prototype.setValues = function (obj) {
		$(this.collection).each(
			function (i, elm) {
				// console.log(elm);
				// console.log(obj);
				elm.setValue(obj);
			}
		);
	};

	/**
	 * [BOUND]
	 */
	PageController.prototype.query = function (ev, caller, obj) {
		var data = buildQueryData(this.collection);
		var self = this;
		var $d = $(document);
		var hash, caller_option, cache;
		// var _args;
		// console.log('PageController: query');
		this.callerOpt = obj || {};
		if (!this.callerOpt.noHistory && !this.callerOpt.append) {
			pushHistory(this.isNativeHistory, this.url, data);
		}

		if (!this.isNativeHistory) {
			this.historyDoubleCallFlag = true;
		}

		// buildTriggerArg is good here like this. 
		// because obj **IS captured** as callerOpt
		// $d.triggerHandler(['beforeajax', this.id].join('.'), this.buildTriggerArg(arguments, 3));
		this.trigger('beforeajax', this.callerOpt);

		hash = CRC32($.param(data));
		if (this.cache[hash]) {
			cache = this.cache[hash];
			// args = [this, this.cache[hash].option, this.cache[hash].resp];
			// console.log('pagetController::render from cache');
			// $d.triggerHandler(['ajax.success', this.id].join('.'), args);
			// $d.triggerHandler(['render', this.id].join('.'), args);
			this
				.trigger('ajax.success', cache.option, cache.resp)
				.trigger('render', cache.option, cache.resp);

			this.callerOpt = null;
			this.lifo = '';
			return;
		}

		caller_option = $.extend({}, this.callerOpt);
		this.lifo = hash;
		$.extend(data, this.consistent);

		// $d.triggerHandler(['ajaxing', this.id].join('.'), [this, caller, data]);
		this.trigger('ajaxing', obj, data);

		$.ajax(
			{
				url: this.url,
				data: data,
				dataType: 'json',
				success: function (resp, successCode, xhr) {
					// var _args;
					// console.log(successCode, data);
					resp = $.trim(resp[0]);
					self.cache[hash] = {
						resp: resp,
						option: caller_option
					};
					self.hasQueried = true;
					if (self.lifo === hash) {
						// _args = self.buildTriggerArg(arguments);
						// console.log('pagetController::render by Ajax');
						// $d.triggerHandler(['ajax.success', self.id].join('.'), _args);
						// $d.triggerHandler(['render', self.id].join('.'), _args);
						self
							.trigger('ajax.success', obj, resp, successCode, xhr)
							.trigger('render', obj, resp, successCode, xhr);

						self.callerOpt = null;
						self.lifo = '';
					}
				},
				error: function (xhr, successCode, data) {
					// $d.triggerHandler(['ajax.error', self.id].join('.'), self.buildTriggerArg(arguments));
					self.trigger('ajax.error', obj, xhr, successCode, data);
					self.callerOpt = null;
					// console.log(data);
					// console.log(successCode);
					// console.log(xhr);
				}
			}
		);
	};

	/**
	 * [BOUND] whenever pop state happens
	 */
	PageController.prototype.onPopstate = function (ev) {
		var state;
		// console.log('PageController:: onPopstate');
		if (this.hasQueried === false) {
			// console.log('page load??');
			return;
		}
		if (this.historyDoubleCallFlag) {
			this.historyDoubleCallFlag = false;
			// console.log('no query!');
			return;
		}
		if (!ev.originalEvent || ev.originalEvent.state === null) {
			state = this.initialQuery;
		}
		else {
			state = ev.originalEvent.state;
		}
		this.setValues(state);
		this.query(null, this, {noHistory: true});
	};

	/**
	 * [BOUND]
	 * FIXME: this is the worst ambigious name.
	 */
	PageController.prototype.attr = function (name) {
		var result = null;
		var index;
		// console.log('PageController: attr');
		if (name instanceof $.Event) {
			name = arguments[1];
		}

		index = this._attrs[name];
		if (index > 0) {
			result = this.collection[ index ];
		}
		return result;
	};

	/**
	 * shorthand for queueProduce
	 * @param {function} func
	 */
	PageController.prototype.ready = function (func) {
		if (this.hasFiredReady) {
			func();
		}
		else {
			Meetup.PageController.queueProduce(this.app_name, func);
		}
	};

	/**
	 * utility tool to create an argument for trigger/register events.
	 * @param {Arguments} arg 
	 * @param {number} index [optional]
	 */
	PageController.prototype.buildTriggerArg = function (arg, index) {
		var result = [this, this.callerOpt];
		index = index || 0;
		if (arg) {
			result = result.concat(Array.prototype.slice.call(arg, index));
		}
		return result;
	};

	/**
	 * use trigger, if you want to communicate with other
	 * presentation/page controller in the page.
	 * @param {DOMElement} dom [OPTIONAL] you are gonna call document, usually.
	 * @param {string} event_name the name of the event you want to invoke
	 * @param {*} [OPTIONAL] the following arguments will be passed
	 */
	PageController.prototype.trigger = function () {
		var dom, event_name, index, opts;
		if (arguments.length === 0) {
			throw new Error('.trigger(name [,opt, opt]) or .trigger(DOM, name [,opt, opt...])');
		}
		if (Meetup.PageController.isDOM(arguments[0])) {
			dom = arguments[0];
			event_name = arguments[1];
			index = 2;
		}
		else {
			dom = document;
			event_name = arguments[0];
			index = 1;
		}
		opts = [this].concat(Array.prototype.slice.call(arguments, index));
		if (this.controller) {
			event_name = [event_name, this.controller.id].join('.');
		}
		else {
			event_name = [event_name, this.id].join('.');
		}
		$(dom).triggerHandler(event_name, opts);
		return this;
	};

	/**
	 * to receive the event by trigger
	 * @param {DOMElement} dom [OPTIONAL] given element or document if omitted.
	 * @param {string} event_name 
	 * @param {function} func
	 */
	PageController.prototype.register = function () {
		var dom, event_name, func;
		if (arguments.length === 0) {
			throw new Error('.register(name [,opt, opt]) or .register(DOM, name [,opt, opt...])');
		}
		if (Meetup.PageController.isDOM(arguments[0])) {
			dom = arguments[0];
			event_name = arguments[1];
			func = arguments[2];
		}
		else {
			dom = document;
			event_name = arguments[0];
			func = arguments[1];
		}
		if (this.controller) {
			event_name = [event_name, this.controller.id].join('.');
		}
		else {
			event_name = [event_name, this.id].join('.');
		}
		$(dom).on(event_name, func);
		return this;
	};

	/**
	 * to receive the event by trigger
	 * @param {DOMElement} dom [OPTIONAL] given element or document if omitted.
	 * @param {string} event_name 
	 * @param {function} func [OPTIONAL]
	 */
	PageController.prototype.unregister = function () {
		var dom, event_name, func;
		if (arguments.length === 0) {
			throw new Error('.unregister(name, func) or .register(DOM, name, func)');
		}
		if (Meetup.PageController.isDOM(arguments[0])) {
			dom = arguments[0];
			event_name = arguments[1];
			func = arguments[2];
		}
		else {
			dom = document;
			event_name = arguments[0];
			func = arguments[1];
		}
		if (this.controller) {
			event_name = [event_name, this.controller.id].join('.');
		}
		else {
			event_name = [event_name, this.id].join('.');
		}
		$(dom).off(event_name, func);
		return this;
	};

	// STATIC variables
	// ===================================

	Meetup.PageController.apps = {};

	// STATIC functions
	// ===================================

	/**
	 * @param {string} app_name
	 * @see rib2 presentation
	 */
	Meetup.PageController.queueProduce = function(app_name) {
		var arr = Meetup.PageController.apps[app_name];
		var hay;
		if (undefined === arr) {
			arr = Meetup.PageController.apps[app_name] = [];
		}
		hay = Array.prototype.slice.call(arguments, 1);
		arr.push( 1 === hay.length ? hay[0] : hay );
	};

	/**
	 * DO NOT pass funcs as string...
	 * @param {object} obj 
	 * @param {array} funcs name of function that will be bind to the `obj`
	 */
	Meetup.PageController.bindAll = function(obj, funcs) {
		var name, i, len;
		if (!funcs || funcs.length === 0) {
			// if no other args passed, bind all
			for (name in obj) {
				if (Meetup.PageController.isFunc(obj[name])) {
					obj[name] = Meetup.PageController.bind(obj[name], obj);
				}
			}
		}
		else {
			// if arg passed, bind only passed name funcs
			for (i = 0, len = funcs.length; i < len; ++i) {
				name = funcs[i];
				if (name && Meetup.PageController.isFunc(obj[name])) {
					obj[name] = Meetup.PageController.bind(obj[name], obj);
				}
			}
		}
	};

	/**
	 * ES5 compliant bind()
	 * @param {function} func
	 * @param {obj} obj context of func
	 */
	Meetup.PageController.bind = function(func, obj) {
		var args = Array.prototype.slice.call(arguments, 2);
		return function () {
			return func.apply(obj || {}, args.concat(Array.prototype.slice.call(arguments)));
		};
	};

	/**
	 * is this function really funciton?
	 * @param {function} obj
	 */
	Meetup.PageController.isFunc = function (obj) {
		var result = false;
		if (obj && obj.constructor && obj.call && obj.apply) {
			result = true;
		}
		return result;
	};

	/**
	 * create a url without query and hash by window.location
	 */
	Meetup.PageController.currentPageUrl = function () {
		var url = [window.location.protocol, '//', window.location.hostname];
		if (window.location.port && window.location.port !== '80') {
			url.push(':');
			url.push(window.location.port);
		}
		url.push(window.location.pathname);
		return url.join('');
	};

	/**
	 * @param {*} val
	 * @param {number} def default value, if `val` is not a integer
	 * @param {number} radix
	 */
	Meetup.PageController.castToInteger = function (val, def, radix) {
		var result;
		def = def || 0;
		radix = radix || 10;
		result = parseInt(val, radix);
		if (isNaN(result)) {
			result = def;
		}
		return result;
	};

	/**
	 * @param {*} val
	 * @param {number} def default value if `val` is not a float
	 */
	Meetup.PageController.castToFloat = function (val, def) {
		var result = parseFloat(val);
		def = def || 0;
		if (isNaN(result)) {
			result = def;
		}
		return result;
	};

	/**
	 * @param {*} element to check if it is a DOMElement
	 */
	Meetup.PageController.isDOM = function (element) {
		var result = false;
		if (element && element.nodeType && element.nodeType == 1) {
			result = true;
		}
		return result;
	};

	// private functions
	// ===================================

	/**
	 * @param {function} popstate the event will be fired when history.js (IE) popstate()
	 * @see [dependency] http://github.com/balupton/history.js
	 */
	var createStatechangeFunc = function (popstate) {
		return function (ev) {
			var e = $.Event('popstate');
			e.originalEvent = {state: History.getState().data};
			popstate(e);
		};
	};

	/**
	 * query builder
	 * @param {array} collection instance collection
	 */
	var buildQueryData = function (collection) {
		var result = {};
		var i = 0;
		var len = collection.length;
		var model, r, _name;
		loop:for (; i < len; ++i) {
			model = collection[i];
			if (model.onlyview === true) {
				continue loop;
			}
			r = model.getValue();
			if (typeof r === 'object') {
				for (_name in r) {
					result[_name] = r[_name];
				}
			}
			else {
				result[model.name] = r;
			}
		}
		// make some value tweak
		return result;
	};

	/**
	 * pushState wrapper
	 * @param {boolean} isNativeHistory
	 * @param {string} url
	 * @param {*} data
	 * @see [dependency] Meetup.URL
	 * @see [dependency] http://github.com/balupton/history.js
	 */
	var pushHistory = function (isNativeHistory, url, data) {
		var myurl = Meetup.URL.mungeUrl(url, data);
		if (isNativeHistory) {
			history.pushState(
				data,
				['Find a Meetup: ', data.keywords].join(''),
				myurl
			);
		}
		else {
			History.pushState(
				data,
				['Find a Meetup: ', data.keywords].join(''),
				myurl
			);
		}
	};

	/**
	 * @param {string} str of url
	 * @see [dependency] $.deparam() from http://github.com/cowboy/jquery-bbq
	 */
	var getHashQuery = function (str) {
		var counter, name, loc, loc_hash, qmark_index;
		var result = null;
		if (!str) {
			loc = window.location;
			loc_hash = loc.hash;
			qmark_index = loc_hash.indexOf('?');
			if (!loc_hash || qmark_index < 0) {
				return result;
			}
			str = loc_hash.slice(qmark_index + 1);
		}
		result = $.deparam(str);
		counter = 0;
		loop:for (name in result) {
			if (result.hasOwnProperty(name)) {
				++counter;
				break loop;
			}
		}
		if (counter === 0) {
			result = null;
		}
		return result;
	};

	/**
	 * @param {Meetup.PageController} rib
	 */
	var createReady = function (rib) {
		return function () {
			var app_name = rib.app_name;
			var queue = Meetup.PageController.apps[app_name];
			var funcs = [];
			var obj = queue.shift();
			while (undefined !== obj) {
				if ('function' === typeof obj) {
					funcs.push(obj);
				}
				else {
					rib.produce.apply(rib, obj);
				}
				obj = queue.shift();
			};
			$.each(
				funcs, 
				function (i, func) {
					func();
				}
			);
			rib.hasFiredReady = true;
		};
	};
}
)(jQuery, window, document);
