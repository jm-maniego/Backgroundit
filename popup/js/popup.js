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
              Backgroundit.query_current_tab({action: "update_styles", params: response.wallpaper_settings})
            }
          })
        }
      }, options)
    }

    chrome.runtime.sendMessage({action: 'show_popup'}, function(response) {
      var settings = response.settings.wallpaper_settings;
      var current_wallpaper = response.current_wallpaper
      var $current_wallpaper = $('#current_wallpaper');

      $current_wallpaper.attr('href', current_wallpaper.source_url);
      $('img', $current_wallpaper).attr('src', current_wallpaper.url);

      $('#blur-slider').slider(slider_options({
        value: settings.blur
      }))
      $('#opacity-slider').slider(slider_options({
        value: settings.opacity
      }))
    })
  });
}(window.jQuery, window, document));