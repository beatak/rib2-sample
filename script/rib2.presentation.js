/**
 * each presentation instance attaches to a html element, 
 * requirements:
 * - the root element of the presentation needs a name
 * - if you want to make it auto update it, you must implement render()
 * - if you want to auto bundle, you must implement getValue() / setValue()
 */
(
function($, window, document) {
	"use strict";

	var noop = function () {};

	/**
	 * presentation constructor
	 * @param {DOMElement | String} element DOM element or ID of string.
	 * @param {object} [option] opts
	 */
	var Presentation = Meetup.Presentation = function (element, opts, controller) {
		var $d = $(document);
		var self = this;
		var $el, name, cache, arr, event, selector, func, i, len;
		// make sure it has a dom element.
		if (typeof element === 'string') {
			if (element.indexOf('#') === 0) {
				element = element.substring(1);
			}
			element = document.getElementById(element);
		}
		else if (element instanceof $) {
			if (element.length > 1) {
				throw new Error('Meetup Presentation needs ONE DOM element. You have passed an array by jQuery.');
			}
			element = element[0];
		}
		if (!Meetup.PageController.isDOM(element)) {
			throw new Error('Meetup Presentation needs a DOM element');
		}
		$el = $(element);

		// make sure it has a name.
		if (element.name) {
			name = element.name;
		}
		else if (opts.name) {
			name = opts.name;
		}
		else if ($el.data('name')) {
			name = $el.data('name');
		}
		else {
			throw new Error('Meetup Presentation needs a name on the DOM element.');
		}

		// MEMBER VARIABLES!
		this.el = element;
		this.name = name;
		this.exports = undefined;
		this.onlyview = false;
		this.controller = controller;

		// double enhancing won't happen
		cache = $d.data('presentations');
		if (!cache) {
			cache = {};
			$d.data('presentations', cache);
		}
		if ($d.data('presentations')[this.name]) {
			// console.log('multi instanciation?');
			return cache[this.name];
		}
		cache[this.name] = this;

		// auto enhancing
		$.extend(this, opts);
		if (isInput(this.el)) {
			if (this.getValue === noop) {
				this.getValue = Meetup.PageController.bind(getValue, this);
			}
			if (this.setValue === noop) {
				this.setValue = Meetup.PageController.bind(setValue, this);
			}
		}

		// bindAll before run each initialize(),
		// so that you can attach event without think
		Meetup.PageController.bindAll(this, this.exports);
		this.initialize.apply(this, arguments);

		this.register('render', this.render);

		if (this.events && this.events.length) {
			for (i = 0, len = this.events.length; i < len; ++i) {
				arr = this.events[i][0].split(' ');
				event = arr.shift();
				selector = arr.join(' ');
				func = this[this.events[i][1]];

				$el.on(event, selector, func);
			}
		}
		return this;
	};

	Presentation.prototype.initialize = noop;
	Presentation.prototype.render = noop;
	Presentation.prototype.getValue = noop;
	Presentation.prototype.setValue = noop;

	/**
	 * @see Meetup.PageController.prototype.trigger
	 */
	Presentation.prototype.trigger = Meetup.PageController.prototype.trigger;

	/**
	 * @see Meetup.PageController.prototype.regeister
	 */
	Presentation.prototype.register = Meetup.PageController.prototype.register;

	/**
	 * @see Meetup.PageController.prototype.unregeister
	 */
	Presentation.prototype.unregister = Meetup.PageController.prototype.unregister;

	// private func
	// ===================================

	var isInput = function (el) {
		var result = false;
		var tag = el.tagName.toLowerCase();
		if (tag === 'input' || tag === 'textarea') {
			result = true;
		}
		return result;
	};

	// following 2 functions needs to be bound
	// because it contains "this".
	// ===================================

	var getValue = function () {
		return $(this.el).val();
	};

	var setValue = function (obj) {
		var mytype = typeof obj;
		if (mytype === 'string') {
			$(this.el).val(obj);
		}
		else if (mytype === 'object') {
			$(this.el).val(obj[this.name]);
		}
	};

})(jQuery, window, document);
