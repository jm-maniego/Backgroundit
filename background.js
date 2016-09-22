var Backgroundify = window.Backgroundify || {};
var Sources = {};
var Wallhaven = {};

chrome.runtime.onMessage.addListener(function(request, sender, response) {
  var params = {}
  $.extend(params, request.params)

  actions[request.action].call(this, request.params, response);
  return true;
});

var actions = {
  get_wallpaper: function(params, response) {
    response({
      url: Backgroundify.wallpaper_collection.get_one()
    });
  }
}

Backgroundify.WallpaperCollection = function() {
  var _this = this;
  _this.source = Sources.Wallhaven;
  _this.list   = [];

  _this.fetch = function() {
    _this.source.fetch({
      success: function(wallpapers) {
        debugger
        _this.list = wallpapers;
      }
    });
  }

  var _generate_random_int = function() {
    var min = 0, max = _this.list.length;
    return Math.floor(Math.random() * (max - min)) + min;
  }

  _this.get_one = function() {
    return _this.list[_generate_random_int()]
  }
}

Wallhaven.wallpaper = function (id) {
  var _this = this;
  var IMG_PREFIX = "http://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-";

  _this.url = '';
  _this.id  = id;

  var _init = function() {
    _this.url = IMG_PREFIX + _this.id + ".jpg";
  }

  _init();
  return this;
}

Wallhaven.source = (function() {
  var _this = this;
  _this.model = Wallhaven.wallpaper;

  var HOME_URL = "https://alpha.wallhaven.cc";
  var PATHS = [
    "/search",
    "/random"
  ]
  var DEFAULTS = {
    url: 0
  }
  var PATTERNS = {
    url: /\.cc\/wallpaper\/([0-9]*)/
  }

  var _init = function() {
    _this.url = HOME_URL + PATHS[DEFAULTS.url];
  }

  var fetch = function(options) {
    var _parse_data = function(data) {
      var wallpaper_id, wallpaper;
      var wallpapers = [];
      var _get_wallpaper_id = function(url) {
        return url.match(PATTERNS.url)[1]
      }

      $(data).find('.preview').map(function() {
        wallpaper_id = _get_wallpaper_id(this.href);
        wallpaper    = new _this.model(wallpaper_id);
        wallpapers.push(wallpaper);
      })

      return {
        wallpapers: wallpapers
      }
    }

    $.ajax({
      url: _this.url,
      type: "GET",
      success: function(response) {
        console.log("FETCH SUCCESS YAY!");
        var parsed_data = _parse_data(response)
        options.success && options.success(parsed_data.wallpapers);
      },
      complete: function() {
        console.log("FETCH COMPLETE YAY!");
      }
    })
  }

  _init();
  return {
    fetch: fetch
  }
})();

Sources.Wallhaven = Wallhaven.source;
Backgroundify.wallpaper_collection = new Backgroundify.WallpaperCollection();
Backgroundify.wallpaper_collection.fetch()