window.Backgroundit = window.Backgroundit || {}

Backgroundit.DropdownButton = class {
  template() {
    this.$el = $('<a href="#" class="bgdit-dropdown bgdit-link thumb-btn thumb-btn-fav"></a>');
    this.$button = $("<i class='fa fa-fw fa-globe'></i>");
    this.$menu = $('<ul class="bgdit-dropdown-menu">');
    this.$el.append(this.$button);
    this.$el.append(this.$menu);
  }

  addItem(text) {
    var $item = $('<li>').text(text);
    this.$menu.append($item);
    return $item;
  }

  hideMenu() {
    this.$menu.hide()
  }

  render() {
    var _this = this;
    this.template();

    this.$button.click(function(e) {
      e.preventDefault();
      $(this).siblings('.bgdit-dropdown-menu').toggle();
    });

    let $backgroundit = this.addItem('Backgroundit');
    $backgroundit.click(function(e) {
      e.preventDefault();
      let params = {id: _this.wallpaper_id, source: 'wallhaven'};
      chrome.runtime.sendMessage({action: 'set_wallpaper', params: params}, function(response) {
        if (response.success) {
          alert('saved!');
        }
        _this.hideMenu();
      });

    })
    return this;
  }
}

Backgroundit.FigureCollection = class {
  constructor(props) {
    this.$el = $('figure:not([data-bgdit-rendered])')
  }
  render() {
    let figure;
    this.$el.each(function() {
      figure = new Backgroundit.FigureItem(this);
      figure.render();
    })
  }
}

Backgroundit.FigureItem = class {
  constructor(id) {
    this.$el = $(id);
  }

  render() {
    let _$set_bg_btn = new Backgroundit.DropdownButton();
    _$set_bg_btn.wallpaper_id = this.$el.data('wallpaper-id');
    this.$el.append(_$set_bg_btn.render().$el);
    this.$el.attr('data-bgdit-rendered', true);
    return this;
  }
}

$(function() {
  var figureCollection = new Backgroundit.FigureCollection();
  figureCollection.render();
})

window.addEventListener("message", function(e) {
  if (event.data.type == "from_content") {
    if (event.data.id == "page_added") {
      var figureCollection = new Backgroundit.FigureCollection();
      figureCollection.render();
    }
  }
})