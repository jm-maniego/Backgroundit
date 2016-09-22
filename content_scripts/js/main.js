var Backgroundify = window.Backgroundify || {};

Backgroundify.WallpaperModel = function() {
  var _this = this;
  _this.url = '';

  var _parse_response = function(response) {
    var wallpaper = response.wallpaper;
    _this.url = wallpaper.url;

    // I dont know why I want to delete this :D
    delete response.wallpaper;
  }

  _this.fetch = function(callback) {
    chrome.runtime.sendMessage({action: 'get_wallpaper'}, function(response) {
      _parse_response(response);
      _this.on_fetch(_this, response);
    })
  }

  _this.on_fetch = function() {}
}

Backgroundify.WallpaperView = function(model) {
  var _this = this;
  _this.$el   = '';
  _this.model = model;

  _this.model.on_fetch = function(wallpaper, response) {
    var settings  = response.settings;
    _this.attach(settings)
  }

  var _init = function() {
    var $container = _this.templates.container()
    $('body').prepend($container);
  }

  _this.templates = {
    container: function() {
      _this.$el = $('<div>', {id: "backgroundify-chromext"});
      return _this.$el;
    }
  }

  _this.attach = function(settings) {
    var wallpaper = _this.model;
    _this.$el.css({
      "background":     "url("+ wallpaper.url +") fixed ",
      "-webkit-filter": "blur("+ settings.blur +"px)",
      "opacity":        settings.opacity,
      "display":        settings.display
    })
  }

  _init();
}

var wallpaper_model = new Backgroundify.WallpaperModel();
var wallpaper_view  = new Backgroundify.WallpaperView(wallpaper_model);

wallpaper_model.fetch();