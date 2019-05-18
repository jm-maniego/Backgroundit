var Backgroundit = window.Backgroundit || {};
var Sources = {};
var Wallhaven = {};
var CustomCollection = {}
Backgroundit.debug = {
  log_settings: function() {
    chrome.storage.local.get(function(settings){console.log(settings)});
  }
}

Backgroundit.config = {
  save_settings: function(settings, callback) {
    chrome.storage.local.set({ ...Backgroundit.config.defaults, ...settings }, callback);
  },
  defaults: {
    source: "wallhaven",
    wallpaper_settings: {
      blur: 0,
      opacity: 40,
      display: "block",
      freeze: "0"
    }
  },
  update_wallpaper_settings: function(settings, callback) {
    console.log('Updating wallpaper settings...');
    $.extend(Backgroundit.config.wallpaper_settings, settings);

    Backgroundit.config.save_settings({wallpaper_settings: Backgroundit.config.wallpaper_settings}, function() {
      Backgroundit.wallpaper_collection.frozen = Backgroundit.config.wallpaper_settings.freeze == "1";

      callback && callback({
        updated: true,
        wallpaper_settings: Backgroundit.config.wallpaper_settings
      });
    });
  }
}
$.extend(Backgroundit.config, Backgroundit.config.defaults)

chrome.runtime.onMessage.addListener(function(request, sender, response) {
  var params = {}
  $.extend(params, request.params)

  actions[request.action].call(this, request.params, response);
  return true;
});

var actions = {
  get_wallpaper: function(params, response) {
    console.log('Getting wallpaper...');
    var current_wallpaper = Backgroundit.wallpaper_collection.get_one();
    current_wallpaper.get_url = current_wallpaper.generate_url(); // shit hack for message passing
    if (current_wallpaper) {
      response({
        wallpaper: current_wallpaper,
        settings: Backgroundit.config.wallpaper_settings
      });
    }
  },
  set_wallpaper: function(params, response) {
    let {source, id} = params;
    if (!id) {
      response({success: false});
      return;
    }
    Backgroundit.config.save_settings({source: source}, function() {
      Backgroundit.wallpaper_collection.set_source(source);
      Backgroundit.wallpaper_collection.set_wallpaper(id, true);
      Backgroundit.wallpaper_collection.freeze();
      response({success: true});
    })
  },
  save_settings: function(params, response) {
    console.log('Saving settings...');
    var {source, source_settings} = params;
    Backgroundit.config.save_settings(params, function() {
      console.log('Saving settings... done.');
      Backgroundit.wallpaper_collection.set_source(source);
      Backgroundit.config.source_settings = source_settings;
      Backgroundit.wallpaper_collection.source.save_settings(source_settings);
      Backgroundit.wallpaper_collection.fetch(response);
    });
  },
  get_settings: function(params, response) {
    response({
      settings: {
        source: Backgroundit.config.source,
        source_settings: Backgroundit.config.source_settings
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
    Backgroundit.config.update_wallpaper_settings(params.wallpaper_settings, response)
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
      success: function(wallpaper_ids) {
        _this.list = wallpaper_ids;
        callback && callback();
      }
    });
  }

  var _generate_random_int = function() {
    var min = 0, max = _this.list.length;
    return Math.floor(Math.random() * (max - min)) + min;
  }

  _this.set_source = function(source_str) {
    Backgroundit.config.source = source_str;
    this.source = Sources.mapping[source_str];
  }

  _this.freeze = function() {
    Backgroundit.config.wallpaper_settings.freeze = "1"
    _this.frozen = true
  }

  _this.get_one = function() {
    if (!_this.frozen) {
      _this.set_wallpaper(_this.list[_generate_random_int()], true);
    }
    return _this.current_wallpaper;
  }

  _this.set_wallpaper = function(id_or_url, save=false) {
    _this.current_wallpaper = new _this.source.model(id_or_url);
    if (save) {
      Backgroundit.config.save_settings({current_wallpaper: id_or_url});
    }
  }
}

class BackgrounditWallpaper {
  constructor(url) {
    this.url = url;
    this.fallback_url = null;
    this.source_url = url;
  }

  generate_url() {
    return "url(" + [this.url, this.fallback_url].filter(x=>x).join("), url(") + ")"
  }
}

Wallhaven.home_url  = "https://alpha.wallhaven.cc";

Wallhaven.wallpaper = class extends BackgrounditWallpaper {
  constructor(id) {
    super(id);
    this.id  = id;
    this._img_prefix = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-";
    this._ext = { jpg: ".jpg", png: ".png" };
    this.url = this._img_prefix + this.id + this._ext.jpg;
    this.fallback_url = this._img_prefix + this.id + this._ext.png;
    this.source_url = Wallhaven.home_url + "/wallpaper/" + this.id;
  }
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
    url: 0
  }
  // var PATTERNS = {
  //   url: /\.cc\/wallpaper\/([0-9]*)/
  // }
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
  _this.sorting = "random";

  var _init = function() {
    _this.url = HOME_URL + PATHS[_this.url_code];
  }

  _this.get_settings = function() {
    return {
      url: _this.url_code,
      q: _this.q,
      categories: _this.categories.values,
      purity: _this.purity.values,
      sorting: _this.sorting
    }
  }

  _this.save_settings = function(settings) {
    // _this.url_code = settings.url;
    _this.url = HOME_URL + PATHS[_this.url_code];
    $.extend(_this, settings && {
      q: settings.q,
      categories: new Wallhaven.parameter('categories', settings.categories),
      purity: new Wallhaven.parameter('purity', settings.purity)
    })
    // _this.sorting = settings.sorting;
  }

  _this.fetch = function(options) {
    var _parse_data = function(data) {
      var wallpaper_id, wallpaper;
      var wallpapers = [];
      // var _get_wallpaper_id = function(url) {
      //   return url.match(PATTERNS.url)[1]
      // }

      $(data).find('figure').map(function() {
        wallpaper_id = $(this).data('wallpaper-id');
        wallpapers.push(wallpaper_id);
      })

      return {
        wallpapers: wallpapers
      }
    }

    $.ajax({
      url: _this.url,
      data: $.extend( {q: _this.q, sorting: _this.sorting},
                      _this.categories.to_param(),
                      _this.purity.to_param()),
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

CustomCollection.wallpaper = class extends BackgrounditWallpaper {
}

CustomCollection.source = class {
  constructor(props={}) {
    this.model = CustomCollection.wallpaper;
    this.data = props.data;
    this.collection = [];
  }
  parsed_data() {
    return this.data.trim().replace(/\s/g, '').split(',');
  }
  save_settings(settings) {
    this.data = settings.data;
    this.collection = this.parsed_data();
  }
  get_settings() {
    return {
      data: this.data,
      collection: this.collection
    }
  }
  fetch(options) {
    options.success.call(this, this.collection);
  }
}

Sources.Wallhaven = new Wallhaven.source;
Sources.CustomCollection = new CustomCollection.source;
Sources.mapping = {
  wallhaven: Sources.Wallhaven,
  custom:    Sources.CustomCollection
};
Backgroundit.wallpaper_collection = new Backgroundit.WallpaperCollection();

chrome.storage.local.get(function(settings) {
  var {source, wallpaper_settings, source_settings, current_wallpaper} =
    $.extend(Backgroundit.config, settings);
  Backgroundit.wallpaper_collection.set_source(source);
  Backgroundit.wallpaper_collection.source.save_settings(source_settings);
  Backgroundit.config.update_wallpaper_settings(wallpaper_settings);
  Backgroundit.wallpaper_collection.set_wallpaper(current_wallpaper);

  Backgroundit.wallpaper_collection.fetch();
});