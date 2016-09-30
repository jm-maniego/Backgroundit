var Backgroundit = window.Backgroundit || {};
var Sources = {};
var Wallhaven = {};
Backgroundit.debug = {
  log_settings: function() {
    chrome.storage.local.get(function(settings){console.log(settings)});
  }
}

Backgroundit.config = {
  save_settings: function(settings, callback) {
    chrome.storage.local.set(settings, callback);
  },
  defaults: {
    wallpaper_settings: {
      blur: 5,
      opacity: 40,
      display: "block",
      freeze: "0"
    }
  }
}
Backgroundit.config.wallpaper_settings = Backgroundit.config.defaults.wallpaper_settings

chrome.runtime.onMessage.addListener(function(request, sender, response) {
  var params = {}
  $.extend(params, request.params)

  actions[request.action].call(this, request.params, response);
  return true;
});

var actions = {
  get_wallpaper: function(params, response) {
    console.log('Getting wallpaper...');
    response({
      wallpaper: Backgroundit.wallpaper_collection.get_one(),
      settings: Backgroundit.config.wallpaper_settings
    });
  },
  save_settings: function(params, response) {
    console.log('Saving settings...');
    Backgroundit.config.save_settings(params, function() {
      console.log('Saving settings... done.');
      Backgroundit.wallpaper_collection.source.save_settings(params.source_settings);
      Backgroundit.wallpaper_collection.fetch(response);
    });
  },
  get_settings: function(params, response) {
    response({
      settings: {
        source_settings: Backgroundit.wallpaper_collection.source.get_settings()
      }
    })
  },
  show_popup: function(params, response) {
    Backgroundit.query_current_tab({action: "get_current_wallpaper"}, function(content_response) {
      response({
        settings: {
          wallpaper_settings: Backgroundit.config.wallpaper_settings
        },
        current_wallpaper: content_response.current_wallpaper
      })
    })
  },
  update_wallpaper_settings: function(params, response) {
    console.log('Updating wallpaper settings...');
    $.extend(Backgroundit.config.wallpaper_settings, params.wallpaper_settings);
    // updated: true.. I don't know why :D
    Backgroundit.config.save_settings(params, function() {
      Backgroundit.wallpaper_collection.frozen = Backgroundit.config.wallpaper_settings.freeze == "1";

      response({
        updated: true,
        wallpaper_settings: Backgroundit.config.wallpaper_settings
      });
    });
  }
}

Backgroundit.WallpaperCollection = function() {
  var _this = this;
  _this.source = Sources.Wallhaven;
  _this.frozen = false
  _this.list   = [];
  _this.current_wallpaper = "";

  _this.fetch = function(callback) {
    _this.source.fetch({
      success: function(wallpapers) {
        _this.list = wallpapers;
        callback && callback();
      }
    });
  }

  var _generate_random_int = function() {
    var min = 0, max = _this.list.length;
    return Math.floor(Math.random() * (max - min)) + min;
  }

  _this.get_one = function() {
    if (!_this.frozen) {
      _this.current_wallpaper = _this.list[_generate_random_int()];
    }
    return _this.current_wallpaper;
  }
}
Wallhaven.home_url  = "https://alpha.wallhaven.cc";
Wallhaven.wallpaper = function(id) {
  var _this = this;
  var IMG_PREFIX = "http://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-";
  var IMG_EXT    = ".jpg";
  var SOURCE_URL = Wallhaven.home_url + "/wallpaper/";

  _this.id  = id;
  _this.url = IMG_PREFIX + _this.id + IMG_EXT;;
  _this.source_url = SOURCE_URL + _this.id;

  // var _init = function() {
  // }

  // _init();
  return this;
}

Wallhaven.parameter = function(key, values) {
  var _this = this;
  _this.values = values;
  _this.key    = key

  _this.to_param = function() {
    var value;
    var return_obj = {};
    return_obj[_this.key] = '';
    for (var key in _this.values) {
      value = _this.values[key];
      return_obj[_this.key] += value;
    }
    return return_obj
  }
}

Wallhaven.source = function() {
  var _this = this;
  _this.model = Wallhaven.wallpaper;

  var HOME_URL = Wallhaven.home_url;
  var PATHS = [
    "/search",
    "/random"
  ]
  var DEFAULTS = {
    url: 1
  }
  var PATTERNS = {
    url: /\.cc\/wallpaper\/([0-9]*)/
  }
  _this.url_code = DEFAULTS.url;
  _this.q = 'kitten';
  _this.categories = new Wallhaven.parameter('categories', {
    general: "1",
    anime: "0",
    people: "0"
  })
  _this.purity = new Wallhaven.parameter('purity', {
    sfw: "1",
    sketchy: "1",
    nsfw: "0"
  })

  var _init = function() {
    _this.url = HOME_URL + PATHS[_this.url_code];
  }

  _this.get_settings = function() {
    return {
      url: _this.url_code,
      q: _this.q,
      categories: _this.categories.values,
      purity: _this.purity.values
    }
  }

  _this.save_settings = function(settings) {
    // _this.url_code = settings.url;
    _this.url = HOME_URL + PATHS[_this.url_code];
    _this.q = settings.q;
    _this.categories = new Wallhaven.parameter('categories', settings.categories)
    _this.purity = new Wallhaven.parameter('purity', settings.purity)
  }

  _this.fetch = function(options) {
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
      data: $.extend({q: _this.q}, _this.categories.to_param(), _this.purity.to_param()),
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
  return _this;
};

Sources.Wallhaven = new Wallhaven.source;
Backgroundit.wallpaper_collection = new Backgroundit.WallpaperCollection();
Backgroundit.wallpaper_collection.fetch()