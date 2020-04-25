const GObject = imports.gi.GObject;
const St = imports.gi.St;
const Main = imports.ui.main;
const ModalDialog = imports.ui.modalDialog;

const Clutter = imports.gi.Clutter;
const Pango = imports.gi.Pango;
const Params = imports.misc.params;
const Signals = imports.signals;
const ShellEntry = imports.ui.shellEntry;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const StatusBar = Me.imports.status_bar;
const CharsCounter = Me.imports.chars_counter;
const ButtonsBar = Me.imports.buttons_bar;
const LanguagesButtons = Me.imports.languages_buttons;
const PrefsKeys = Me.imports.prefs_keys;
const Utils = Me.imports.utils;
const GoogleTTS = Me.imports.google_tts;

const EntryBase = class EntryBase {
    constructor(params) {
        this.params = Params.parse(params, {
            box_style: "translator-text-box",
            entry_style: "translator-entry"
        });

        this.scroll = new St.ScrollView({
            style_class: this.params.box_style
        });

        this.actor = new St.BoxLayout({
            reactive: true,
            x_expand: true,
            y_expand: true,
            x_align: St.Align.END,
            y_align: St.Align.MIDDLE
        });
        this.actor.connect("button-press-event", () => {
            this._clutter_text.grab_key_focus();
        });
        this.actor.add(this.scroll, {
            x_fill: true,
            y_fill: true,
            expand: true
        });

        this._entry = new St.Entry({
            style_class: this.params.entry_style
        });
        ShellEntry.addContextMenu(this._entry);

        this._clutter_text = this._entry.get_clutter_text();
        this._clutter_text.set_single_line_mode(false);
        this._clutter_text.set_activatable(false);
        this._clutter_text.set_line_wrap(true);
        this._clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._clutter_text.set_max_length(0);
        this._clutter_text.connect("key-press-event", (o, e) =>
            this._on_key_press_event(o, e)
        );
        this.set_font_size(Utils.SETTINGS.get_int(PrefsKeys.FONT_SIZE_KEY));

        this._font_connection_id = Utils.SETTINGS.connect(
            "changed::" + PrefsKeys.FONT_SIZE_KEY,
            () => {
                this.set_font_size(
                    Utils.SETTINGS.get_int(PrefsKeys.FONT_SIZE_KEY)
                );
            }
        );

        this._box = new St.BoxLayout({
            vertical: true
        });
        this._box.add(this._entry, {
            y_align: St.Align.START,
            y_fill: true
        });

        this.scroll.add_actor(this._box);
    }

    _on_key_press_event(o, e) {
        let symbol = e.get_key_symbol();
        let code = e.get_key_code();
        let state = e.get_state();

        let cyrillic_control = 8196;
        let cyrillic_shift = 8192;

        let control_mask =
            // state === Clutter.ModifierType.CONTROL_MASK ||
            state === cyrillic_control;
        let shift_mask =
            // state === Clutter.ModifierType.SHIFT_MASK ||
            state === cyrillic_shift;

        if (symbol == Clutter.Right) {
            let sel = this._clutter_text.get_selection_bound();

            if (sel === -1) {
                this._clutter_text.set_cursor_position(
                    this._clutter_text.text.length
                );
            }

            return false;
        }
        // cyrillic Ctrl+A
        else if (control_mask && code == 38) {
            this._clutter_text.set_selection(0, this._clutter_text.text.length);
            return true;
        }
        // cyrillic Ctrl+C
        else if (control_mask && code == 54) {
            let clipboard = St.Clipboard.get_default();
            let selection = this._clutter_text.get_selection();
            let text;

            if (!Utils.is_blank(selection)) text = selection;
            else text = this._clutter_text.text;

            clipboard.set_text(text);
            return true;
        }
        // cyrillic Ctrl+V
        else if (control_mask && code == 55) {
            let clipboard = St.Clipboard.get_default();
            clipboard.get_text((clipboard, text) => {
                if (!Utils.is_blank(text)) {
                    this._clutter_text.delete_selection();
                    this._clutter_text.set_text(this._clutter_text.text + text);
                    return true;
                }

                return false;
            });
        } else if (
            (state == Clutter.ModifierType.CONTROL_MASK ||
                state == cyrillic_control) &&
            (symbol == Clutter.Return || symbol == Clutter.KP_Enter)
        ) {
            this.emit("activate");
            return Clutter.EVENT_STOP;
        } else {
            // let t = {
            //     state: state,
            //     symbol: symbol,
            //     code: code
            // };
            // log(JSON.stringify(t, null, '\t'));
        }

        return false;
    }

    destroy() {
        if (this._font_connection_id > 0) {
            Utils.SETTINGS.disconnect(this._font_connection_id);
        }

        this.actor.destroy();
    }

    grab_key_focus() {
        this._clutter_text.grab_key_focus();
    }

    set_size(width, height) {
        this.scroll.set_width(width);
        this.scroll.set_height(height);
    }

    set_font_size(size) {
        let style_string = "font-size: %spx".format(size);
        this.entry.set_style(style_string);
    }

    get entry() {
        return this._entry;
    }

    get clutter_text() {
        return this._clutter_text;
    }

    get text() {
        return this._entry.get_text();
    }

    set text(text) {
        this._entry.set_text(text);
    }

    set markup(markup) {
        this._clutter_text.set_markup(markup);
    }

    get length() {
        return this._entry.get_text().length;
    }

    get is_empty() {
        return this._entry.get_text().length < 1;
    }

    get max_length() {
        return this._clutter_text.get_max_length();
    }

    set max_length(length) {
        length = parseInt(length, 10) || 0;
        this._clutter_text.set_max_length(length);
        this.emit("max-length-changed");
    }
};
Signals.addSignalMethods(EntryBase.prototype);

const SourceEntry = class SourceEntry extends EntryBase {
    constructor() {
        super({
            entry_style: "translator-entry",
            box_style: "translator-source-text-box"
        });

        let v_adjust = this.scroll.vscroll.adjustment;
        v_adjust.connect("changed", () => {
            v_adjust.value = v_adjust.upper - v_adjust.page_size;
        });
    }
};

const TargetEntry = class TargetEntry extends EntryBase {
    constructor() {
        super({
            box_style: "translator-target-text-box",
            entry_style: "translator-entry"
        });

        this._clutter_text.set_editable(false);
    }
};

const ListenButton = class ListenButton {
    constructor() {
        this.actor = new St.Button({
            style_class: "listen-button",
            x_expand: false,
            y_expand: false,
            x_fill: false,
            y_fill: false,
            x_align: St.Align.START,
            y_align: St.Align.MIDDLE
        });
        this._icon = new St.Icon({
            icon_name: Utils.ICONS.listen,
            icon_size: 15
        });

        this.actor.add_actor(this._icon);
    }

    show() {
        this.actor.show();
    }

    hide() {
        this.actor.hide();
    }

    destroy() {
        this.actor.destroy();
    }
};

log("TranslatorDialog");
var TranslatorDialog = GObject.registerClass({}, class TranslatorDialog extends ModalDialog.ModalDialog {
    _init(text_translator) {
        super._init({
            shellReactive: false,
            destroyOnClose: false
        });

        this._text_translator = text_translator;

        this._dialogLayout =
            typeof this.dialogLayout === "undefined"
                ? this._dialogLayout
                : this.dialogLayout;
        this._dialogLayout.set_style_class_name("translator-box");

        this._source = new SourceEntry();
        this._source.clutter_text.connect("text-changed", () =>
            this._on_source_changed()
        );
        this._source.connect("max-length-changed", () => {
            this._chars_counter.max_length = this._source.max_length;
        });
        this._target = new TargetEntry();
        this._target.clutter_text.connect("text-changed", () =>
            this._on_target_changed()
        );

        this._connection_ids = {
            source_scroll: 0,
            target_scroll: 0,
            sync_scroll_settings: 0,
            show_most_used: 0
        };

        this._topbar = new ButtonsBar.ButtonsBar({
            style_class: "translator-top-bar-box"
        });
        this._topbar.actor.x_expand = true;
        this._topbar.actor.x_align = St.Align.MIDDLE;

        this._dialog_menu = new ButtonsBar.ButtonsBar();
        this._dialog_menu.actor.x_expand = true;
        this._dialog_menu.actor.y_expand = true;
        this._dialog_menu.actor.x_align = St.Align.END;
        this._dialog_menu.actor.y_align = St.Align.MIDDLE;

        this._statusbar = new StatusBar.StatusBar();
        this._statusbar.actor.x_align = St.Align.END;
        this._statusbar.actor.set_style('height: 30px');
        this._most_used_bar = false;

        this._chars_counter = new CharsCounter.CharsCounter();
        // this._chars_counter.

        this._google_tts = new GoogleTTS.GoogleTTS();
        this._listen_source_button = new ListenButton();
        this._listen_source_button.hide();
        this._listen_source_button.actor.connect("clicked", () => {
            this.google_tts.speak(
                this._source.text,
                this._text_translator.current_source_lang
            );
        });
        this._listen_target_button = new ListenButton();
        this._listen_target_button.hide();
        this._listen_target_button.actor.connect("clicked", () => {
            let lines_count = this._source.text.split("\n").length;
            let translation = this._target.text
                .split("\n")
                .slice(0, lines_count)
                .join("\n");
            this.google_tts.speak(
                translation,
                this._text_translator.current_target_lang
            );
        });

        this._grid_layout = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });
        this._table = new St.Widget({
            layout_manager: this._grid_layout
        });
        this._grid_layout.attach(this._topbar.actor, 0, 0, 4, 1);
        this._grid_layout.attach(this._dialog_menu.actor, 2, 0, 2, 1);
        this._grid_layout.attach(this._source.actor, 0, 2, 2, 1);
        this._grid_layout.attach(this._target.actor, 2, 2, 2, 1);
        this._grid_layout.attach(this._listen_source_button.actor, 1, 3, 1, 1);
        this._grid_layout.attach(this._chars_counter.actor, 0, 3, 1, 2);
        this._grid_layout.attach(this._listen_target_button.actor, 3, 3, 1, 1);
        this._grid_layout.attach(this._statusbar.actor, 2, 3, 2, 1);

        this.contentLayout.add_child(this._table);

        this._init_most_used_bar();
        this._init_scroll_sync();
    }

    _on_source_changed() {
        this._chars_counter.current_length = this._source.length;

        if (!this._source.is_empty) this._listen_source_button.show();
        else this._listen_source_button.hide();
    }

    _on_target_changed() {
        if (!this._target.is_empty) this._listen_target_button.show();
        else this._listen_target_button.hide();
    }

    _init_scroll_sync() {
        if (Utils.SETTINGS.get_boolean(PrefsKeys.SYNC_ENTRIES_SCROLL_KEY)) {
            this.sync_entries_scroll();
        }
        this._connection_ids.sync_scroll_settings = Utils.SETTINGS.connect(
            "changed::" + PrefsKeys.SYNC_ENTRIES_SCROLL_KEY,
            () => {
                let sync = Utils.SETTINGS.get_boolean(
                    PrefsKeys.SYNC_ENTRIES_SCROLL_KEY
                );

                if (sync) this.sync_entries_scroll();
                else this.unsync_entries_scroll();
            }
        );
    }

    _init_most_used_bar() {
        if (Utils.SETTINGS.get_boolean(PrefsKeys.SHOW_MOST_USED_KEY)) {
            this._show_most_used_bar();
        }
        this._connection_ids.show_most_used = Utils.SETTINGS.connect(
            "changed::%s".format(PrefsKeys.SHOW_MOST_USED_KEY),
            () => {
                if (Utils.SETTINGS.get_boolean(PrefsKeys.SHOW_MOST_USED_KEY)) {
                    this._show_most_used_bar();
                } else {
                    this._hide_most_used_bar();
                }
            }
        );
    }

    _show_most_used_bar() {
        if (!this._most_used_bar) {
            this._most_used_sources = new LanguagesButtons.LanguagesButtons();
            this._most_used_targets = new LanguagesButtons.LanguagesButtons();
            this._most_used_bar = true;
        }

        this._topbar.actor.set_style("padding-bottom: 0px;");
        this._grid_layout.attach(this._most_used_sources.actor, 0, 1, 1, 1);
        this._grid_layout.attach(this._most_used_targets.actor, 1, 1, 1, 1);
    }

    _hide_most_used_bar() {
        if (this._most_used_bar) {
            this._topbar.actor.set_style("padding-bottom: 10px;");
            this._most_used_sources.destroy();
            this._most_used_targets.destroy();
            this._most_used_bar = false;
        }
    }

    _get_statusbar_height() {
        let message_id = this._statusbar.add_message("Sample message 1.");
        let result = this._statusbar.actor.get_preferred_height(-1)[1];
        this._statusbar.remove_message(message_id);
        return result;
    }

    _resize() {
        let width_percents = Utils.SETTINGS.get_int(
            PrefsKeys.WIDTH_PERCENTS_KEY
        );
        let height_percents = Utils.SETTINGS.get_int(
            PrefsKeys.HEIGHT_PERCENTS_KEY
        );
        let primary = Main.layoutManager.primaryMonitor;

        let box_width = Math.round((primary.width / 100) * width_percents);
        let box_height = Math.round((primary.height / 100) * height_percents);
        this._dialogLayout.set_width(
            box_width +
                this._dialogLayout.get_theme_node().get_padding(St.Side.LEFT) *
                    2
        );
        this._dialogLayout.set_height(
            box_height +
                this._dialogLayout.get_theme_node().get_padding(St.Side.TOP) * 2
        );

        let text_box_width = Math.round(
            box_width / 2 - 45 // The margin of the translator box
        );
        let text_box_height =
            box_height -
            this._topbar.actor.height -
            Math.max(
                this._get_statusbar_height(),
                this._chars_counter.actor.height
            );

        if (this._most_used_bar) {
            text_box_height -= Math.max(
                this._most_used_sources.actor.height,
                this._most_used_targets.actor.height
            );
        }

        this._source.set_size(text_box_width, text_box_height - 100);
        this._target.set_size(text_box_width, text_box_height - 100);
    }

    sync_entries_scroll() {
        if (this._connection_ids.source_scroll < 1) {
            let source_v_adjust = this._source.scroll.vscroll.adjustment;
            this._connection_ids.source_scroll = source_v_adjust.connect(
                "notify::value",
                adjustment => {
                    let target_adjustment = this._target.scroll.vscroll
                        .adjustment;

                    if (target_adjustment.value === adjustment.value) return;
                    target_adjustment.value = adjustment.value;
                    adjustment.upper =
                        adjustment.upper > target_adjustment.upper
                            ? adjustment.upper
                            : target_adjustment.upper;
                }
            );
        }

        if (this._connection_ids.target_scroll < 1) {
            let target_v_adjust = this._target.scroll.vscroll.adjustment;
            this._connection_ids.target_scroll = target_v_adjust.connect(
                "notify::value",
                adjustment => {
                    let source_adjustment = this._source.scroll.vscroll
                        .adjustment;

                    if (source_adjustment.value === adjustment.value) return;
                    source_adjustment.value = adjustment.value;

                    adjustment.upper =
                        adjustment.upper > source_adjustment.upper
                            ? adjustment.upper
                            : source_adjustment.upper;
                }
            );
        }
    }

    unsync_entries_scroll() {
        if (this._connection_ids.source_scroll > 0) {
            let source_v_adjust = this._source.scroll.vscroll.adjustment;
            source_v_adjust.disconnect(this._connection_ids.source_scroll);
            this._connection_ids.source_scroll = 0;
        }

        if (this._connection_ids.target_scroll > 0) {
            let target_v_adjust = this._target.scroll.vscroll.adjustment;
            target_v_adjust.disconnect(this._connection_ids.target_scroll);
            this._connection_ids.target_scroll = 0;
        }
    }

    open() {
        super.open();
        this._resize();
    }

    close() {
        this._statusbar.clear();
        super.close();
    }

    destroy() {
        if (this._connection_ids.sync_scroll_settings > 0) {
            Utils.SETTINGS.disconnect(
                this._connection_ids.sync_scroll_settings
            );
        }
        if (this._connection_ids.show_most_used > 0) {
            Utils.SETTINGS.disconnect(this._connection_ids.show_most_used);
        }

        delete this._text_translator;

        this._source.destroy();
        this._target.destroy();
        this._statusbar.destroy();
        this._dialog_menu.destroy();
        this._topbar.destroy();
        this._chars_counter.destroy();
        this._listen_source_button.destroy();
        this._listen_target_button.destroy();
        this._google_tts.destroy();
        super.destroy();
    }

    get source() {
        return this._source;
    }

    get target() {
        return this._target;
    }

    get topbar() {
        return this._topbar;
    }

    get dialog_menu() {
        return this._dialog_menu;
    }

    get statusbar() {
        return this._statusbar;
    }

    get dialog_layout() {
        return this._dialogLayout;
    }

    get most_used() {
        let r = {
            sources: this._most_used_sources,
            targets: this._most_used_targets
        };
        return r;
    }

    get google_tts() {
        return this._google_tts;
    }
});

log("registerClass");
// var TranslatorDialog = GObject.registerClass(TD);
