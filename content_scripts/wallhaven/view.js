window.Backgroundit = window.Backgroundit || {}
Backgroundit.BackgrounditDropdownButton = class {
  constructor(id) {
    this.wallpaper_id = id;
  }
  _template() {
    this.$el = $('<div class="button bgdit-dropdown-button">')
    // this.$caretDown = $('<button class="bgdit-dropdown-toggle"><i class="fa fa-fw fa-caret-down"></button>')
    this.$name = $(`<button><i class="fa fa-fw fa-globe"></i> Backgroundit</button>`)
    this.$el.append(this.$name);
    // this.$el.append(this.$caretDown);
  }

  render() {
    var _this = this;
    this._template();

    this.$name.click(function(e) {
      e.preventDefault();
      var params = {id: _this.wallpaper_id, source: "wallhaven"};
      Backgroundit.util.set_wallpaper(params);
    });

    return this;
  }
}

Backgroundit.wallpaper_id = $('img#wallpaper').data('wallpaper-id');
Backgroundit.backgrounditButton = new Backgroundit.BackgrounditDropdownButton(Backgroundit.wallpaper_id);
$('#fav-button').after(Backgroundit.backgrounditButton.render().$el);