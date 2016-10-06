var Backgroundit = window.Backgroundit || {};

Backgroundit.WallpaperModel = function() {
  var _this = this;
  _this.url = '';

  var _parse_response = function(response) {
    var wallpaper = response.wallpaper;
    _this.url = wallpaper.url;
    _this.source_url = wallpaper.source_url;
    _this.fallback_url = wallpaper.fallback_url;
  }

  _this.fetch = function(callback) {
    console.log('Requesting wallpaper...')
    chrome.runtime.sendMessage({action: 'get_wallpaper'}, function(response) {
      console.log('Requesting wallpaper... done.')
      _parse_response(response);
      _this.on_fetch(_this, response);
    })
  }

  _this.on_fetch = function() {}
}

Backgroundit.WallpaperView = function(model) {
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
      _this.$el = $('<div>', {id: "backgroundit-chromext"});
      return _this.$el;
    }
  }

  _this.bind_events = function() {
    var actions = {
      update_styles: function(params, response) {
        _this.update_styles(params);
      },
      get_current_wallpaper: function(params, response) {
        response({
          current_wallpaper: _this.model
        })
      }
    }
    chrome.runtime.onMessage.addListener(function(request, sender, response) {
      actions[request.action].call(this, request.params, response);
      return true;
    })
  }

  _this.update_styles = function(wallpaper_settings) {
    var opacity = wallpaper_settings.opacity/100;

    _this.$el.css({
      "background":     "url("+ _this.model.url +"), url("+ _this.model.fallback_url +") fixed ",
      "-webkit-filter": "blur("+ wallpaper_settings.blur +"px)",
      "opacity":        opacity,
      "display":        wallpaper_settings.display,
      "-webkit-transform": "translateZ(0)",
      "transform": "translateZ(0)",
      "background-size": "cover"
    })
  }

  _this.attach = function(wallpaper_settings) {
    console.log('Attaching wallpaper...')
    _this.update_styles(wallpaper_settings);
    _this.bind_events();
  }

  _init();
}

var wallpaper_model = new Backgroundit.WallpaperModel();
var wallpaper_view  = new Backgroundit.WallpaperView(wallpaper_model);

wallpaper_model.fetch();