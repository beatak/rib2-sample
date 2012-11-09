$(
function () {
	"use strict";	

	// ===========================================

	Meetup.PageController.queueProduce(
		'flickr',
		'sidebar',
		{
			name: 'sidebar',
      inputs: null,
			events: [
				['keyup input', 'onInputKeyup'],
        ['click .mymymy', 'onElClick']
			],

			// =======================================

      onElClick: function (ev) {
        alert('hihi');
      },

			// methods
			initialize: function () {
				console.log('SIDEBAR::INIT');
        var inputs = $(this.el).find('input').map(
          function(i, elm) {
            return elm;
          }
        );
        this.inputs = inputs;
			},

			getValue: function () {
				console.log('SIDEBAR::getValue');
        var result = {};
        $.each(
          this.inputs, 
          function (i, elm) {
            var $elm = $(elm);
            result[$elm.prop('name')] = $elm.val();
          }
        );
        return result;
			},

			setValue: function () {
				console.log('SIDEBAR::setValue');
			},

			render: function () {
				console.log('SIDEBAR::render');
			},

			// =======================================

			// event handler
			onInputKeyup: function (ev) {
				console.log('SIDEBAR:: onInputKeyup');
        if (13 === ev.which) {
          this.trigger('query');
        }
			}
		}
	);
});
