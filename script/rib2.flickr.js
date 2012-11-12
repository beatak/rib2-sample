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
      },

      forgeHistory: function (data) {
        var myurl, mytitle;
        var arr_myurl = this.url.split('/');
        var arr_title = ['Hi rib'];
        arr_myurl.pop();
        myurl = Meetup.URL.mungeUrl(arr_myurl.join('/'), data);
        if (data.text) {
          arr_title.push(': ');
          arr_title.push(data.text);
        }
        mytitle = arr_title.join('');
        document.title = mytitle;
        return [data, mytitle, myurl];
      }
    }
  ];

	var func = new Function ('app_name', 'opt', 'readyfunc', 'return new Meetup.PageController(app_name, opt, readyfunc);');
  window.fl = func.apply(null, arg);

});