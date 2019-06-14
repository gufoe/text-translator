const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const Me = ExtensionUtils.getCurrentExtension();
const PrefsKeys = Me.imports.prefs_keys;
const Utils = Me.imports.utils;
const TranslationProviderBase =
    Me.imports.translation_provider_base.TranslationProviderBase;

var TranslatorsManager = class TranslatorsManager {
    constructor(extension_object) {
        this._extension_object = extension_object;
        this._translators = this._load_translators();
        this._default = this.get_by_name(
            Utils.SETTINGS.get_string(PrefsKeys.DEFAULT_TRANSLATOR_KEY)
        );
        this._current = this._default;
    }

    _load_translators() {
        let translators = [];
        let translators_imports = Me.imports.translation_providers;
        let files_list = Utils.get_files_in_dir(
            Me.path + "/translation_providers"
        );

        for (let i = 0; i < files_list.length; i++) {
            let file_name = files_list[i];
            let module_name = file_name.slice(0, -3);

            if (!Utils.ends_with(file_name, "_translation_provider.js"))
                continue;

            let translator = new translators_imports[module_name].Translator(
                this._extension_object
            );
            translator.file_name = file_name;
            translators.push(translator);
        }

        return translators;
    }

    get_by_name(name) {
        if (Utils.is_blank(name)) return false;

        for (let i = 0; i < this._translators.length; i++) {
            let translator = this._translators[i];

            if (translator.name.toLowerCase() == name.toLowerCase()) {
                return translator;
            }
        }

        return false;
    }

    get current() {
        return this._current;
    }

    set current(translator_object_or_name) {
        let name = translator_object_or_name;
        let translator = translator_object_or_name;

        if (translator_object_or_name instanceof TranslationProviderBase) {
            name = translator_object_or_name.name;
        } else {
            translator = this.get_by_name(name);
        }

        this._current = translator;

        Utils.SETTINGS.set_string(PrefsKeys.LAST_TRANSLATOR_KEY, name);
    }

    get last_used() {
        let name = Utils.SETTINGS.get_string(PrefsKeys.LAST_TRANSLATOR_KEY);
        let translator = this.get_by_name(name);
        if (!translator) return false;

        return translator;
    }

    get default() {
        return this._default;
    }

    get translators_names() {
        let result = [];

        for (let i = 0; i < this._translators.length; i++) {
            result.push(this._translators[i].name);
        }

        return result;
    }

    get translators() {
        return this._translators;
    }

    get num_translators() {
        return this._translators.length;
    }

    destroy() {
        for (let i = 0; i < this._translators.length; i++) {
            this._translators[i].destroy();
        }
    }
};
