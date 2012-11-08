$(
function () {
	"use strict";	

	// PRIVATE CONSTANTS
	var CLASS_SELECTION = 'selected';

	// ===========================================

	Meetup.PageController.queueProduce(
		'flickr',

		'keyword',
		{
			name: 'text',

			events: [
				['click', 'onElClick']
			],

			// =======================================

			// methods
			initialize: function () {
				console.log('KEYWORD::INIT');
        $(this.el.form).submit(this.onFormSubmit);
			},

			getValue: function () {
				console.log('KEYWORD::getValue');
				return $(this.el).val();
			},

			setValue: function () {
				console.log('KEYWORD::setValue');
			},

			render: function () {
				console.log('KEYWORD::render');
			},

			// =======================================

			// event handler
			onElClick: function (ev) {
				console.log('KEYWORD::ONELCLICK');
				ev.preventDefault();
				ev.stopPropagation();
			},

      onFormSubmit: function (ev) {
				console.log('KEYWORD:: onFormSubmit');
        ev.preventDefault();
        ev.stopPropagation();
        this.trigger('query');

      }

		}
	);

});
