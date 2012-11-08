$(
function () {
	'use strict';

	// PRIVATE CONSTANTS
  var SELECTOR_FORM = '#nav';

	// ===========================================

	var arg = [
		'flickr',
    {
      url: Meetup.URL.excludeQueries( $(SELECTOR_FORM).prop('action') ),
			consistent: {
				'op': 'search'
			},

      initialize: function () {
        console.log('HI');
      }

    }
  ];

	var func = new Function ('app_name', 'opt', 'readyfunc', 'return new Meetup.PageController(app_name, opt, readyfunc);');
  window.fl = func.apply(null, arg);

});