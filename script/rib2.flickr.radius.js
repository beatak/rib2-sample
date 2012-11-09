$(
function () {
	"use strict";	

	// ===========================================

	Meetup.PageController.queueProduce(
		'flickr',
		'radius',
		{
			name: 'radius',
			events: [],

			// =======================================

			// methods
			initialize: function () {
				console.log('RADIUS::INIT');
			},

			getValue: function () {
				console.log('RADIUS::getValue');
        return $(this.el).val();
			},

			setValue: function () {
				console.log('RADIUS::setValue');
			},

			render: function () {
				console.log('RADIUS::render');
			}

			// =======================================
		}
	);
});
