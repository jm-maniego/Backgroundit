(function($, window, document) {
  $(function() {
    $('#backgroundify-form').on('submit', function(e) {
      e.preventDefault();
      $('#notification').text('Saving...').css({"border-bottom": "1px yellow solid"}).show();

      var params = $.deparam($('#backgroundify-form').serialize());
      chrome.runtime.sendMessage({action: 'save_source_settings', params: params}, function(response) {
        $('#notification').text('Saved!').css({"border-bottom": "1px green solid"}).fadeOut(3200);
      })
    })
  });
}(window.jQuery, window, document));