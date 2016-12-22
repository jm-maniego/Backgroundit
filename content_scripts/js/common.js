window.Backgroundit = window.Backgroundit || {}
Backgroundit.route = {
  set_wallpaper: function(params, callback) {
    chrome.runtime.sendMessage({action: 'set_wallpaper', params: params}, callback)
  }
}

Backgroundit.util = {
  set_wallpaper: function(params, callback) {
    Backgroundit.route.set_wallpaper(params, function(response) {
      if (response.success) {
        alert('saved!');
      }
      callback && callback(response);
    });
  }
}