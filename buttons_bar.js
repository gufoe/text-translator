const St = imports.gi.St;
const Params = imports.misc.params;
const Tweener = imports.ui.tweener;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

var ButtonsBarButton = class ButtonsBarButton {
    constructor(icon_name, label_text, tip_text, params, action) {
        this.params = Params.parse(params, {
            button_style_class: "translator-button",
            box_style_class: "translator-button-box",
            track_hover: true,
            reactive: true,
            toggle_mode: false,
            icon_style: "translator-buttons-bar-icon",
            statusbar: false
        });
        this._button_box = new St.BoxLayout({
            style_class: this.params.box_style_class
        });
        this._button_content = new St.BoxLayout();

        this._sensitive = true;

        this._button = new St.Button({
            track_hover: this.params.track_hover,
            reactive: this.params.reactive,
            style_class: this.params.button_style_class,
            toggle_mode: this.params.toggle_mode
        });
        this._button.add_actor(this._button_content);
        this._button_box.add_actor(this._button);

        if (typeof action == "function") {
            this._button.connect("clicked", () => {
                if (this._sensitive) action();
            });
        }

        this._icon = false;
        this._label = false;
        this._label_text = label_text;
        this._tip_text = tip_text;

        if (!Utils.is_blank(icon_name)) {
            this._icon = new St.Icon({
                icon_name: icon_name,
                style_class: this.params.icon_style
            });

            this._button_content.add(this._icon, {
                x_fill: false,
                x_align: St.Align.START
            });
        }

        if (!Utils.is_blank(this._label_text)) {
            this._label = new St.Label();
            this._label.clutter_text.set_markup(this._label_text);

            this._button_content.add(this._label, {
                x_fill: false,
                y_align: St.Align.MIDDLE
            });

            if (this._icon) {
                this._label.visible = false;
            }
        }

        this._button.connect("enter-event", () => this._on_enter_event());
        this._button.connect("leave-event", () => this._on_leave_event());

        if (!this._icon && !this._label) {
            throw new Error("icon and label are both false");
        }
    }

    _on_enter_event(object, event) {
        if (this.params.statusbar && !Utils.is_blank(this._tip_text)) {
            this._statusbar_message_id = this.params.statusbar.add_message(
                this._tip_text
            );
        }

        if (this._icon && this._label) {
            this._label.opacity = 0;
            this._label.show();

            Tweener.addTween(this._label, {
                time: 0.3,
                opacity: 255,
                transition: "easeOutQuad"
            });
        }
    }

    _on_leave_event(object, event) {
        if (this.params.statusbar && !Utils.is_blank(this._tip_text)) {
            this.params.statusbar.remove_message(this._statusbar_message_id);
        }

        if (this._icon && this._label) {
            Tweener.addTween(this._label, {
                time: 0.3,
                opacity: 0,
                transition: "easeOutQuad",
                onComplete: () => {
                    this._label.hide();
                }
            });
        }
    }

    connect(signal, callback) {
        this.button.connect(signal, callback);
    }

    set_checked(checked) {
        if (checked) {
            this.button.add_style_pseudo_class("active");
        } else {
            this.button.remove_style_pseudo_class("active");
        }

        this.button.set_checked(checked);
    }

    get_checked() {
        return this.button.get_checked();
    }

    set_sensitive(sensitive) {
        this._sensitive = sensitive;
    }

    destroy() {
        this.params = null;
        this._label_text = null;
        this._tip_text = null;
        this._button_box.destroy();
    }

    get label_actor() {
        return this._label;
    }

    get label() {
        return this._label.clutter_text.get_text();
    }

    set label(text) {
        this._label.clutter_text.set_markup(text);
    }

    get icon_actor() {
        return this._icon;
    }

    get icon_name() {
        return this._icon.icon_name;
    }

    set icon_name(name) {
        this._icon.icon_name = name;
    }

    get has_icon() {
        return this._icon !== false ? true : false;
    }

    get has_label() {
        return this._label !== false ? true : false;
    }

    get button() {
        return this._button;
    }

    get actor() {
        return this._button_box;
    }
};

var ButtonsBarLabel = class ButtonsBarLabel {
    constructor(text, style_class) {
        this._label = new St.Label({
            style_class: style_class
        });
        this._label.clutter_text.set_markup(text);

        this.actor = new St.BoxLayout();
        this.actor.add(this._label);
    }

    get label_actor() {
        return this._label;
    }

    get label() {
        return this._label.clutter_text.get_text();
    }

    set label(text) {
        this._label.clutter_text.set_markup(text);
    }
};

var ButtonsBar = class ButtonsBar {
    constructor(params) {
        this.params = Params.parse(params, {
            style_class: "translator-buttons-bar-box"
        });

        this.actor = new St.BoxLayout({
            style_class: this.params.style_class
        });
        this._buttons = [];
    }

    add_button(button) {
        this._buttons.push(button);
        this.actor.add(button.actor, {
            x_fill: false,
            x_align: St.Align.START
        });
    }

    clear() {
        for (let i = 0; i < this._buttons.length; i++) {
            let button = this._buttons[i];
            button.destroy();
        }
    }

    destroy() {
        this.actor.destroy();
    }
};
