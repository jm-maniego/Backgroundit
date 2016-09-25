(function($, window, document) {
  $(function() {
    var slider_options = function(options) {
      return $.extend({
        animate: "fast",
        change: function(event, ui) {

        }
      }, options)
    }

    chrome.runtime.sendMessage({action: 'get_wallpaper_settings'}, function(response) {
      var settings = response.settings.wallpaper_settings;

      $('#blur-slider').slider(slider_options({
        value: settings.blur
      }))
      $('#opacity-slider').slider(slider_options({
        value: +settings.opacity*100
      }))
    })
  });
}(window.jQuery, window, document));