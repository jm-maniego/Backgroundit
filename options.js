(function($, window, document) {
  $(function() {
    var $form         = $('#backgroundit-form');
    var $notification = $('#notification');

    $('div[contenteditable][data-content-for]').on('keyup', function() {
      var $this = $(this);
      $('#' + $this.data('content-for')).val($this.text().trim());
    })

    $('div[data-content-for=source_settings_collection]').on('keydown', function(e) {
      if (e.which == 13) {
        e.preventDefault();
        $form.submit();
      }
    })

    chrome.runtime.sendMessage({action: 'get_settings'}, function(response) {
      var {source, source_settings} = response.settings;

      $('#source-' + source).prop('checked', true).trigger('change');
      $('#url-' + source_settings.url).attr('checked', true);
      debugger
      $('[data-content-for=source_settings_collection]').text(source_settings.data).trigger('keyup');
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

      var params = $.deparam($('#backgroundit-form').serialize());
      chrome.runtime.sendMessage({action: 'save_settings', params: params}, function(response) {
        $notification.text('Saved!').fadeOut(3200);
      })
    })

    $('input[type=radio][data-visible-for]').on('change', function(event) {
      var $radio_btn   = $(this);
      var name_to_hide = $radio_btn.attr('name');
      var name_to_show = $radio_btn.data('visible-for');
      var checked      = $radio_btn.is(':checked')

      checked && $('[data-name='+ name_to_hide +']').hide();
      $('[data-visible-for='+ name_to_show +']:not(input)').toggle(checked);
    }).trigger('change');
  });
}(window.jQuery, window, document));