(function($, window, document) {
  $(function() {
    var slider_options = function(options) {
      return $.extend({
        animate: "fast",
        change: function(event, ui) {
          var params = {wallpaper_settings: {}};
          var key    = $(event.target).data('name');
          var value  = ui.value;
          params.wallpaper_settings[key] = value;

          chrome.runtime.sendMessage({action: 'update_wallpaper_settings', params: params}, function(response) {
            if (response.updated) {
              chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, response.wallpaper_settings);
              });
            }
          })
        }
      }, options)
    }

    chrome.runtime.sendMessage({action: 'get_wallpaper_settings'}, function(response) {
      var settings = response.settings.wallpaper_settings;

      $('#blur-slider').slider(slider_options({
        value: settings.blur
      }))
      $('#opacity-slider').slider(slider_options({
        value: settings.opacity
      }))
    })
  });
}(window.jQuery, window, document));