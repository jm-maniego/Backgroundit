(function($, window, document) {
  $(function() {
    var $form         = $('#backgroundify-form');
    var $notification = $('#notification');

    chrome.runtime.sendMessage({action: 'get_settings'}, function(response) {
      var settings        = response.settings;
      var source_settings = settings.source_settings;

      $('#url-' + source_settings.url).attr('checked', true);
      $('#query-keyword').val(source_settings.q).text(source_settings.q);
      $.each({categories: source_settings.categories, purity: source_settings.purity}, function(filter_key, values) {
        $.each(values, function(key, value) {
          $('[name="source_settings['+ filter_key +']['+ key +']"]').attr('checked', value== '1');
        })
      })
    })

    $form.on('submit', function(e) {
      e.preventDefault();
      $notification.stop(true, true).text('Saving...').show();

      var params = $.deparam($('#backgroundify-form').serialize());
      chrome.runtime.sendMessage({action: 'save_settings', params: params}, function(response) {
        $notification.text('Saved!').fadeOut(3200);
      })
    })
  });
}(window.jQuery, window, document));