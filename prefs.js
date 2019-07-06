const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Params = imports.misc.params;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const PrefsKeys = Me.imports.prefs_keys;
const TranslatorsManager = Me.imports.translators_manager;

ExtensionUtils.get_text_translator_extension = function() {
    return Me;
};

const TranslatorProvidersWidget = GObject.registerClass(
    {
        Name: "Translator.Providers.Widget",
        GTypeName: "TranslatorProvidersWidget"
    },
    class TranslatorProvidersWidget extends Gtk.Grid {
        _init() {
            super._init();
            this.set_orientation(Gtk.Orientation.VERTICAL);
            this.margin = this.row_spacing = this.column_spacing = 10;

            this._translators_manager = new TranslatorsManager.TranslatorsManager();
            let names = this._translators_manager.translators_names;

            this.POSITIONS = {
                translators: { col: 0, row: 0, colspan: 2, rowspan: 1 },
                default_source_label: {
                    col: 0,
                    row: 1,
                    colspan: 1,
                    rowspan: 1
                },
                default_source: { col: 1, row: 1, colspan: 1, rowspan: 1 },
                default_target_label: {
                    col: 0,
                    row: 2,
                    colspan: 1,
                    rowspan: 1
                },
                default_target: { col: 1, row: 2, colspan: 1, rowspan: 1 },
                last_used_label: { col: 0, row: 3, colspan: 1, rowspan: 1 },
                last_used: { col: 1, row: 3, colspan: 1, rowspan: 1 }
            };

            // translators
            this._translators_combo = this._get_combo(names, 0);
            this._translators_combo.set_active_id(names[0]);
            this._translators_combo.connect("changed", combo => {
                let name = combo.get_active_id();
                this._show_settings(name);
            });
            this.attach(
                // col, row, colspan, rowspan
                this._translators_combo,
                this.POSITIONS.translators.col,
                this.POSITIONS.translators.row,
                this.POSITIONS.translators.colspan,
                this.POSITIONS.translators.rowspan
            );

            // default source
            this._source_languages_combo = this._get_combo([]);
            let label = new Gtk.Label({
                label: "Default source language:",
                hexpand: true,
                halign: Gtk.Align.START
            });
            this.attach(
                label,
                this.POSITIONS.default_source_label.col,
                this.POSITIONS.default_source_label.row,
                this.POSITIONS.default_source_label.colspan,
                this.POSITIONS.default_source_label.rowspan
            );

            // default target
            this._target_languages_combo = this._get_combo([]);
            label = new Gtk.Label({
                label: "Default target language:",
                hexpand: true,
                halign: Gtk.Align.START
            });
            this.attach(
                label,
                this.POSITIONS.default_target_label.col,
                this.POSITIONS.default_target_label.row,
                this.POSITIONS.default_target_label.colspan,
                this.POSITIONS.default_target_label.rowspan
            );

            // remember last lang
            label = new Gtk.Label({
                label: "Remember the last used languages:",
                hexpand: true,
                halign: Gtk.Align.START
            });
            this.attach(
                label,
                this.POSITIONS.last_used_label.col,
                this.POSITIONS.last_used_label.row,
                this.POSITIONS.last_used_label.colspan,
                this.POSITIONS.last_used_label.rowspan
            );
            this._last_used = new Gtk.Switch({
                active: false
            });
            this._last_used.connect("notify::active", s => {
                let active = s.get_active();
                let name = this._translators_combo.get_active_id();
                let translator = this._translators_manager.get_by_name(name);
                translator.prefs.remember_last_lang = active;
            });
            this.attach(
                this._last_used,
                this.POSITIONS.last_used.col,
                this.POSITIONS.last_used.row,
                this.POSITIONS.last_used.colspan,
                this.POSITIONS.last_used.rowspan
            );

            this._show_settings(names[0]);
        }

        _get_combo(items) {
            let combo_box = new Gtk.ComboBoxText();

            for (let i = 0; i < items.length; i++) {
                combo_box.insert(-1, items[i], items[i]);
            }

            return combo_box;
        }

        _load_default_source(languages, active_id) {
            this._source_languages_combo.destroy();

            this._source_languages_combo = new Gtk.ComboBoxText();
            this._source_languages_combo.connect("changed", combo => {
                let name = this._translators_combo.get_active_id();
                let translator = this._translators_manager.get_by_name(name);
                let lang_code = combo.get_active_id();

                if (!translator || translator.prefs.default_source == lang_code)
                    return;

                translator.prefs.default_source = lang_code;
                let languages = translator.get_pairs(lang_code);
                let active_id = -1;

                if (languages[translator.prefs.default_target] != undefined) {
                    active_id = translator.prefs.default_target;
                }

                this._load_default_target(languages, active_id);
            });

            for (let key in languages) {
                this._source_languages_combo.insert(-1, key, languages[key]);
            }

            if (active_id === -1) {
                active_id = Object.keys(languages)[0];
            }

            this._source_languages_combo.set_active_id(active_id);

            let source_wrap_width = Math.round(
                Object.keys(languages).length / 17
            );

            if (source_wrap_width > 1) {
                this._source_languages_combo.set_wrap_width(source_wrap_width);
            }

            this._source_languages_combo.show();

            this.attach(
                this._source_languages_combo,
                this.POSITIONS.default_source.col,
                this.POSITIONS.default_source.row,
                this.POSITIONS.default_source.colspan,
                this.POSITIONS.default_source.rowspan
            );
        }

        _load_default_target(languages, active_id) {
            this._target_languages_combo.destroy();

            this._target_languages_combo = new Gtk.ComboBoxText();
            this._target_languages_combo.connect("changed", combo => {
                let name = this._translators_combo.get_active_id();
                let translator = this._translators_manager.get_by_name(name);
                let lang_code = combo.get_active_id();

                if (!translator || translator.prefs.default_target == lang_code)
                    return;

                translator.prefs.default_target = lang_code;
            });

            for (let key in languages) {
                this._target_languages_combo.insert(-1, key, languages[key]);
            }

            if (active_id === -1) {
                active_id = Object.keys(languages)[0];
            }

            this._target_languages_combo.set_active_id(active_id);

            let target_wrap_width = Math.round(
                Object.keys(languages).length / 17
            );

            if (target_wrap_width > 1) {
                this._target_languages_combo.set_wrap_width(target_wrap_width);
            }

            this._target_languages_combo.show();

            this.attach(
                this._target_languages_combo,
                this.POSITIONS.default_target.col,
                this.POSITIONS.default_target.row,
                this.POSITIONS.default_target.colspan,
                this.POSITIONS.default_target.rowspan
            );
        }

        _show_settings(name) {
            let translator = this._translators_manager.get_by_name(name);

            let source_langs = translator.get_languages();
            this._load_default_source(
                source_langs,
                translator.prefs.default_source
            );

            let target_langs = translator.get_pairs(
                translator.prefs.default_source
            );
            this._load_default_target(
                target_langs,
                translator.prefs.default_target
            );

            this._last_used.set_active(translator.prefs.remember_last_lang);
        }
    }
);

const TranslatorKeybindingsWidget = GObject.registerClass(
    {
        Name: "Translator.Keybindings.Widget",
        GTypeName: "TranslatorKeybindingsWidget"
    },
    class TranslatorKeybindingsWidget extends Gtk.Box {
        _init(keybindings) {
            super._init();
            this.set_orientation(Gtk.Orientation.VERTICAL);

            this._keybindings = keybindings;

            let scrolled_window = new Gtk.ScrolledWindow();
            scrolled_window.set_policy(
                Gtk.PolicyType.AUTOMATIC,
                Gtk.PolicyType.AUTOMATIC
            );

            this._columns = {
                NAME: 0,
                ACCEL_NAME: 1,
                MODS: 2,
                KEY: 3
            };

            this._store = new Gtk.ListStore();
            this._store.set_column_types([
                GObject.TYPE_STRING,
                GObject.TYPE_STRING,
                GObject.TYPE_INT,
                GObject.TYPE_INT
            ]);

            this._tree_view = new Gtk.TreeView({
                model: this._store,
                hexpand: true,
                vexpand: true
            });
            this._tree_view.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

            let action_renderer = new Gtk.CellRendererText();
            let action_column = new Gtk.TreeViewColumn({
                title: "Action",
                expand: true
            });
            action_column.pack_start(action_renderer, true);
            action_column.add_attribute(action_renderer, "text", 1);
            this._tree_view.append_column(action_column);

            let keybinding_renderer = new Gtk.CellRendererAccel({
                editable: true,
                "accel-mode": Gtk.CellRendererAccelMode.GTK
            });
            keybinding_renderer.connect(
                "accel-edited",
                (renderer, iter, key, mods) => {
                    let value = Gtk.accelerator_name(key, mods);
                    let [success, iterator] = this._store.get_iter_from_string(
                        iter
                    );

                    if (!success) {
                        printerr("Can't change keybinding");
                    }

                    let name = this._store.get_value(iterator, 0);

                    this._store.set(
                        iterator,
                        [this._columns.MODS, this._columns.KEY],
                        [mods, key]
                    );
                    Utils.SETTINGS.set_strv(name, [value]);
                }
            );

            let keybinding_column = new Gtk.TreeViewColumn({
                title: "Modify"
            });
            keybinding_column.pack_end(keybinding_renderer, false);
            keybinding_column.add_attribute(
                keybinding_renderer,
                "accel-mods",
                this._columns.MODS
            );
            keybinding_column.add_attribute(
                keybinding_renderer,
                "accel-key",
                this._columns.KEY
            );
            this._tree_view.append_column(keybinding_column);

            scrolled_window.add(this._tree_view);
            this.add(scrolled_window);

            this._refresh();
        }

        _refresh() {
            this._store.clear();

            for (let settings_key in this._keybindings) {
                let [key, mods] = Gtk.accelerator_parse(
                    Utils.SETTINGS.get_strv(settings_key)[0]
                );

                let iter = this._store.append();
                this._store.set(
                    iter,
                    [
                        this._columns.NAME,
                        this._columns.ACCEL_NAME,
                        this._columns.MODS,
                        this._columns.KEY
                    ],
                    [settings_key, this._keybindings[settings_key], mods, key]
                );
            }
        }
    }
);

const TranslatorPrefsGrid = GObject.registerClass(
    {
        Name: "Translator.Prefs.Grid",
        GTypeName: "TranslatorPrefsGrid"
    },
    class TranslatorPrefsGrid extends Gtk.Grid {
        _init(params) {
            super._init(params);
            this._settings = Utils.SETTINGS;
            this.margin = this.row_spacing = this.column_spacing = 10;
            this._rownum = 0;
        }

        add_entry(text, key) {
            let item = new Gtk.Entry({
                hexpand: false
            });
            item.text = this._settings.get_string(key);
            this._settings.bind(
                key,
                item,
                "text",
                Gio.SettingsBindFlags.DEFAULT
            );

            return this.add_row(text, item);
        }

        add_shortcut(text, settings_key) {
            let item = new Gtk.Entry({
                hexpand: false
            });
            item.set_text(this._settings.get_strv(settings_key)[0]);
            item.connect("changed", entry => {
                let [key, mods] = Gtk.accelerator_parse(entry.get_text());

                if (Gtk.accelerator_valid(key, mods)) {
                    let shortcut = Gtk.accelerator_name(key, mods);
                    this._settings.set_strv(settings_key, [shortcut]);
                }
            });

            return this.add_row(text, item);
        }

        add_boolean(text, key) {
            let item = new Gtk.Switch({
                active: this._settings.get_boolean(key)
            });
            this._settings.bind(
                key,
                item,
                "active",
                Gio.SettingsBindFlags.DEFAULT
            );

            return this.add_row(text, item);
        }

        add_combo(text, key, list, type) {
            let item = new Gtk.ComboBoxText();

            for (let i = 0; i < list.length; i++) {
                let title = list[i].title.trim();
                let id = list[i].value.toString();
                item.insert(-1, id, title);
            }

            if (type === "string") {
                item.set_active_id(this._settings.get_string(key));
            } else {
                item.set_active_id(this._settings.get_int(key).toString());
            }

            item.connect("changed", combo => {
                let value = combo.get_active_id();

                if (type === "string") {
                    if (this._settings.get_string(key) !== value) {
                        this._settings.set_string(key, value);
                    }
                } else {
                    value = parseInt(value, 10);

                    if (this._settings.get_int(key) !== value) {
                        this._settings.set_int(key, value);
                    }
                }
            });

            return this.add_row(text, item);
        }

        add_spin(label, key, adjustment_properties, spin_properties) {
            adjustment_properties = Params.parse(adjustment_properties, {
                lower: 0,
                upper: 100,
                step_increment: 100
            });
            let adjustment = new Gtk.Adjustment(adjustment_properties);

            spin_properties = Params.parse(
                spin_properties,
                {
                    adjustment: adjustment,
                    numeric: true,
                    snap_to_ticks: true
                },
                true
            );
            let spin_button = new Gtk.SpinButton(spin_properties);

            spin_button.set_value(this._settings.get_int(key));
            spin_button.connect("value-changed", spin => {
                let value = spin.get_value_as_int();

                if (this._settings.get_int(key) !== value) {
                    this._settings.set_int(key, value);
                }
            });

            return this.add_row(label, spin_button, true);
        }

        add_row(text, widget, wrap) {
            let label = new Gtk.Label({
                label: text,
                hexpand: true,
                halign: Gtk.Align.START
            });
            label.set_line_wrap(wrap || false);

            this.attach(label, 0, this._rownum, 1, 1); // col, row, colspan, rowspan
            this.attach(widget, 1, this._rownum, 1, 1);
            this._rownum++;

            return widget;
        }

        add_item(widget, col, colspan, rowspan) {
            this.attach(
                widget,
                col || 0,
                this._rownum,
                colspan || 2,
                rowspan || 1
            );
            this._rownum++;

            return widget;
        }

        add_range(label, key, range_properties) {
            range_properties = Params.parse(range_properties, {
                min: 0,
                max: 100,
                step: 10,
                mark_position: 0,
                add_mark: false,
                size: 200,
                draw_value: true
            });

            let range = Gtk.Scale.new_with_range(
                Gtk.Orientation.HORIZONTAL,
                range_properties.min,
                range_properties.max,
                range_properties.step
            );
            range.set_value(this._settings.get_int(key));
            range.set_draw_value(range_properties.draw_value);

            if (range_properties.add_mark) {
                range.add_mark(
                    range_properties.mark_position,
                    Gtk.PositionType.BOTTOM,
                    null
                );
            }

            range.set_size_request(range_properties.size, -1);

            range.connect("value-changed", slider => {
                this._settings.set_int(key, slider.get_value());
            });

            return this.add_row(label, range, true);
        }
    }
);

const TextTranslatorPrefsWidget = GObject.registerClass(
    {
        Name: "TextTranslator.Prefs.Widget",
        GTypeName: "TextTranslatorPrefsWidget"
    },
    class TextTranslatorPrefsWidget extends Gtk.Box {
        _init(params) {
            super._init(params);
            this.set_orientation(Gtk.Orientation.VERTICAL);
            this._settings = Utils.SETTINGS;

            let main = this._get_main_page();
            let providers = this._get_providers_page();
            let size = this._get_size_page();
            let keybindings = this._get_keybindings_page();

            let stack = new Gtk.Stack({
                transition_type: Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
                transition_duration: 500
            });
            let stack_switcher = new Gtk.StackSwitcher({
                margin_left: 5,
                margin_top: 5,
                margin_bottom: 5,
                margin_right: 5,
                stack: stack
            });

            stack.add_titled(main.page, main.name, main.name);
            stack.add_titled(providers.page, providers.name, providers.name);
            stack.add_titled(size.page, size.name, size.name);
            stack.add_titled(
                keybindings.page,
                keybindings.name,
                keybindings.name
            );

            this.add(stack_switcher);
            this.add(stack);
        }

        _get_main_page() {
            let name = "Main";
            let page = new TranslatorPrefsGrid();

            let translators_manager = new TranslatorsManager.TranslatorsManager();
            let names = translators_manager.translators_names;
            let result_list = [];

            for (let i = 0; i < names.length; i++) {
                let item = {
                    title: names[i],
                    value: names[i]
                };
                result_list.push(item);
            }
            //
            // page.add_combo(
            //     'Default translator:',
            //     PrefsKeys.DEFAULT_TRANSLATOR_KEY,
            //     result_list,
            //     'string'
            // );
            //
            // page.add_boolean(
            //     'Remember the last used translator:',
            //     PrefsKeys.REMEMBER_LAST_TRANSLATOR_KEY
            // );
            page.add_boolean("Show icon:", PrefsKeys.SHOW_ICON_KEY);
            page.add_boolean(
                "Sync entries scrolling:",
                PrefsKeys.SYNC_ENTRIES_SCROLL_KEY
            );
            page.add_boolean(
                "Enable shortcuts:",
                PrefsKeys.ENABLE_SHORTCUTS_KEY
            );
            page.add_boolean(
                "Show the most used languages:",
                PrefsKeys.SHOW_MOST_USED_KEY
            );
            page.add_boolean(
                "Auto speak result:",
                PrefsKeys.ENABLE_AUTO_SPEAK_KEY
            );

            let spin_properties = {
                lower: 5,
                upper: 30,
                step_increment: 1
            };
            page.add_spin(
                "Font size:",
                PrefsKeys.FONT_SIZE_KEY,
                spin_properties
            );

            let result = {
                name: name,
                page: page
            };
            return result;
        }

        _get_providers_page() {
            let name = "Translators";
            let page = new TranslatorProvidersWidget();

            let result = {
                name: name,
                page: page
            };
            return result;
        }

        _get_size_page() {
            let name = "Size";
            let page = new TranslatorPrefsGrid();

            let range_properties = {
                min: 10,
                max: 100,
                step: 10,
                size: 300
            };
            page.add_range(
                "Width (% of screen):",
                PrefsKeys.WIDTH_PERCENTS_KEY,
                range_properties
            );
            page.add_range(
                "Height (% of screen):",
                PrefsKeys.HEIGHT_PERCENTS_KEY,
                range_properties
            );

            let result = {
                name: name,
                page: page
            };
            return result;
        }

        _get_keybindings_page() {
            let name = "Shortcuts";

            let keybindings = {};
            keybindings[PrefsKeys.OPEN_TRANSLATOR_KEY] =
                "Open tranlator dialog";
            keybindings[PrefsKeys.TRANSLATE_FROM_CLIPBOARD_KEY] =
                "Translate from clipboard";
            keybindings[PrefsKeys.TRANSLATE_FROM_SELECTION_KEY] =
                "Translate from primary selection";

            let page = new TranslatorKeybindingsWidget(keybindings);

            let result = {
                name: name,
                page: page
            };
            return result;
        }
    }
);

function init() {
    // nothing
}

function buildPrefsWidget() {
    let widget = new TextTranslatorPrefsWidget();
    widget.show_all();

    return widget;
}
