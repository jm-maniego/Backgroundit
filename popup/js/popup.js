(function($, window, document) {
  $(function() {
    var $wallpaper_settings_form = $('#wallpaper_settings_form');
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
      $('object', $current_wallpaper).attr('data', current_wallpaper.fallback_url);
      $('img', $current_wallpaper).attr('src', current_wallpaper.url);

      $('#wallpaper_settings_display').attr('checked', settings.display == "block");
      $('#wallpaper_settings_freeze').attr('checked', settings.freeze == "1");
      $('#blur-slider').slider(slider_options({
        value: settings.blur
      }))
      $('#opacity-slider').slider(slider_options({
        value: settings.opacity
      }))
    })

    $('input', $wallpaper_settings_form).on('change', function(){
      $wallpaper_settings_form.trigger('submit');
    })

    $wallpaper_settings_form.on('submit', function(e) {
      e.preventDefault();

      var params = $.deparam($wallpaper_settings_form.serialize());
      chrome.runtime.sendMessage({action: 'update_wallpaper_settings', params: params}, function(response) {
        if (response.updated) {
          Backgroundit.query_current_tab({action: "update_styles", params: response.wallpaper_settings})
        }
      })
    })
  });
}(window.jQuery, window, document));