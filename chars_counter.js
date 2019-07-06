const St = imports.gi.St;
const Tweener = imports.ui.tweener;

var CharsCounter = class CharsCounter {
    constructor() {
        this.actor = new St.BoxLayout({
            style_class: "translator-chars-counter-box",
            visible: false
        });

        this._current_length = 0;
        this._max_length = 0;

        this._current_length_label = new St.Label({
            style_class: "translator-chars-counter-text"
        });
        this._current_length_label.get_clutter_text().set_use_markup(true);

        this._max_length_label = new St.Label({
            style_class: "translator-chars-counter-text"
        });
        this._max_length_label.get_clutter_text().set_use_markup(true);

        this._separator_label = new St.Label({
            style_class: "translator-chars-counter-text",
            text: "/"
        });

        this.actor.add_actor(this._current_length_label);
        this.actor.add_actor(this._separator_label);
        this.actor.add_actor(this._max_length_label);
    }

    _show() {
        if (this.actor.visible) return;

        this.actor.opacity = 0;
        this.actor.show();

        Tweener.addTween(this.actor, {
            time: 0.3,
            transition: "easeOutQuad",
            opacity: 255
        });
    }

    _hide() {
        if (!this.actor.visible) return;

        Tweener.addTween(this.actor, {
            time: 0.3,
            transition: "easeOutQuad",
            opacity: 0,
            onComplete: () => {
                this.actor.hide();
                this.actor.opacity = 255;
            }
        });
    }

    _maybe_show() {
        if (this._max_length < 1 || this._current_length < 1) {
            this._hide();
            return;
        }

        if (this.actor.visible) return;

        this._show();
    }

    _current_length_changed() {
        this._maybe_show();

        let markup;

        if (this._current_length >= this._max_length) {
            markup = '<span color="red"><b>%s</b></span>'.format(
                this._current_length.toString()
            );
        } else {
            markup = this._current_length.toString();
        }

        let clutter_text = this._current_length_label.get_clutter_text();

        Tweener.addTween(this._current_length_label, {
            time: 0.2,
            transition: "easeOutQuad",
            opacity: 100,
            onComplete: () => {
                clutter_text.set_markup(markup);

                Tweener.addTween(this._current_length_label, {
                    time: 0.2,
                    transition: "easeOutQuad",
                    opacity: 255
                });
            }
        });

        clutter_text.set_markup(markup);
    }

    _max_length_changed() {
        this._maybe_show();
        let markup = "<b>%s</b>".format(this._max_length.toString());
        let clutter_text = this._max_length_label.get_clutter_text();

        Tweener.addTween(this._max_length_label, {
            time: 0.2,
            transition: "easeOutQuad",
            opacity: 100,
            onComplete: () => {
                clutter_text.set_markup(markup);

                Tweener.addTween(this._max_length_label, {
                    time: 0.2,
                    transition: "easeOutQuad",
                    opacity: 255
                });
            }
        });

        clutter_text.set_markup(markup);
        this._current_length_changed();
    }

    destroy() {
        this.actor.destroy();
    }

    get current_length() {
        return this._current_length;
    }

    set current_length(length) {
        this._current_length = length;
        this._current_length_changed();
    }

    get max_length() {
        return this._max_length;
    }

    set max_length(length) {
        this._max_length = length;
        this._max_length_changed();
    }
};
