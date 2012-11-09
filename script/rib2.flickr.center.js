$(
function () {
	"use strict";	

	// PRIVATE CONSTANTS
	var CLASS_SELECTION = 'selected';
  var SELECTOR_TPL = '#tpl-thumbnail-li';
  var SELECTOR_UL = '.thumbnails';

	// ===========================================

	Meetup.PageController.queueProduce(
		'flickr',
		'center',
		{
			name: 'center',
      elList: null,
      tplListItem: null,
			events: [],

			// =======================================

			// methods
			initialize: function () {
				console.log('CENTER::INIT');
        this.elList = $(this.el).find(SELECTOR_UL);
        this.tplListItem = $.trim( $(SELECTOR_TPL).html() );
			},

			getValue: function () {
				console.log('CENTER::getValue');
				return 0;
			},

			setValue: function () {
				console.log('CENTER::setValue');
			},

      /**
       * because rib is kinda expecting text back, instead of 
       * json or xml. so resp is empty
       */
			render: function (ev, caller, opt, resp, successCode, xhr) {
				console.log('CENTER::render');
        var obj = JSON.parse(xhr.responseText);
        var tpl = this.tplListItem;
        var arr = [];
        $.each(
          obj.photos.photo,
          function (i, photo) {
            arr.push( 
              Mustache.render(
                tpl, 
                {
                  OWNER_ID: photo.owner,
                  PHOTO_ID: photo.id,
                  IMAGE_SRC: photo.url_m,
                  IMAGE_TITLE: photo.title,
                  IMAGE_DESC: photo.description._content,
                  AUTHOR: photo.ownername
                }
              )
            );
          }
        );
        $(this.elList).html( arr.join('') );
			}

			// =======================================

		}
	);
});
