//= require <plug-in/jquery.deparam>

if (typeof Meetup === 'undefined') {
	Meetup = {};
}

(function () {

var ROOT = 'http://www.dev.meetup.com/';
var API = '/api/';

/**
 * Meetup.URLObjectBuilder returns an object with root useful URLs 
 * and methods that JS uses a lot. DO NOT instatiate this, unless 
 * you really need it.  Instead, you can use Meetup.URL.xxx().
 * @function
 * @param {string} grouphome [optional] url for group home 
 * @see web/templates/{3|4}/top_inc.jsp
 */
Meetup.URLObjectBuilder = function (grouphome) {
	var result = {
		root: ROOT,
		api: API,
		mungeUrl: mungeUrl,
		extractQueries: extractQueries,
		excludeQueries: excludeQueries
	};

	if (grouphome) {
		result.grouphome = grouphome;
		// well, this may not be the best idea, but this
		// is meant to be a utility. grouphome / chapter
		// point to the same url.
		result.chapter = grouphome;
		result.chapterapi = [result.grouphome, 'api/'].join('');
	}

	var inner = new UrlFunctions();
	for (var i in inner) {
		result[i] = inner[i];
	}
	return result;
};

/**
 * munge url with an object representation query!
 * @function
 * @param {string} base the base url that you want to add a query to.
 * @param {object} obj key-value object that you want to add to the base url.
 */
var mungeUrl = function(base, obj) {
	var baseUrl = excludeQueries(base);
	var arr = extractQueries(base);
	console.log(base, baseUrl, arr, obj);
	return [baseUrl, '?', $.param($.extend(arr[0], arr[1], obj))].join('');
};

/**
 * depending on $.deparam(). Takes an url as string, returns an array. The 
 * first element of the returning array is an object represtation of an 
 * equivalent portion of window.location.search. The second is an object
 * represetation of en quivalent portion of window.location.hash.
 * @function 
 * @param {string} str the url you want to munipulate
 * @see https://developer.mozilla.org/en/DOM/window.location
 */
var extractQueries = function (str) {
	var q_index = str.indexOf('?');
	var h_index = str.indexOf('#');
	var search = {};
	var hash = {};
	if (q_index < 0) {
		if (h_index < 0) {
			// no ?, no #
		}
		else {
			// no ?, # exists
			hash = $.deparam(str.substring(h_index + 1));				
		}
	}
	else {
		if (h_index < 0) {
			// ? exists, no #
			search = $.deparam(str.substring(q_index + 1));
		}
		else {
			// both ? exists, # exists
			if (q_index < h_index) {
				search = $.deparam(str.substring(q_index + 1, h_index));
				hash = $.deparam( getParamStringFromHash(str.substring(h_index + 1)) );
			}
			else {
				hash = $.deparam( getParamStringFromHash(str.substring(h_index + 1)) );
			}
		}
	}
	return [search, hash];
};

/**
 * It takes an url as string, returns the url without "search" and "hash"
 * Note: this won't convert relative path to full path.  If you need to convert
 * "/foobar?what=1#yeah=2" to "http://www.meetup.com/foobar", you need to 
 * do like $('<a href="{{string}}" />').attr('href');.
 * @function
 * @param {string} str the url you want to munipulate
 * @see https://developer.mozilla.org/en/DOM/window.location
 */
var excludeQueries = function (str) {
	var q_index = str.indexOf('?');
	var h_index = str.indexOf('#');
	var result;
	if (q_index < 0) {
		if (h_index < 0) {
			// no ?, no #
			result = str;
		}
		else {
			// no ?, # exists
			result = str.substring(0, h_index);
		}
	}
	else {
		if (h_index < 0) {
			// ? exists, no #
			result = str.substring(0, q_index);
		}
		else {
			// both ? exists, # exists
			if (q_index < h_index) {
				result = str.substring(0, q_index);
			}
			else {
				result = str.substring(0, h_index);
			}
		}
	}
	return result;
};

/**
 * [private] Utility function that returns string without '?' or '!'
 * @function
 * @param {string} str
 */
var getParamStringFromHash = function (str) {
	var result;
	var c = str.charAt(0);
	if (c === '?' || c === '!') {
		result = str.substring(1);
	}
	else {
		result = str;
	}
	return result;
};

/**
 * instace functions 
 * =================
 */

var UrlFunctions = function () {};

/**
 * returns a member profile url by given member id. 
 * if it's on the group context, you'll get a group profile as default.
 * @function
 * @param {string|number} member member id
 * @param {boolean} sitewide true if you want to get an URL for sitewide 
 * profile
 */
UrlFunctions.prototype.member = function (member, sitewide) {
	var result, mid = parseInt(member, 10);
	if (isNaN(mid)) {
		return null;
	}
	sitewide = sitewide || false;
	if (sitewide || !this.grouphome) {
		result = [this.root, 'members/', mid, '/'].join('');
	}
	else {
		result = [this.grouphome, 'members/', mid, '/'].join('');
	}
	return result;
};

/**
 * returns an event url by given event id.
 * returns null, if the current context is not group.
 * @function
 * @param {string|number} event event id
 */
UrlFunctions.prototype.event = function (event) {
	var eid = parseInt(event, 10);
	if (isNaN(eid) || !this.grouphome) {
		return null;
	}
	return [this.grouphome, 'events/', eid, '/'].join('');
};

})();