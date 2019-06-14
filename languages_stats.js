const Signals = imports.signals;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const PrefsKeys = Me.imports.prefs_keys;
const Utils = Me.imports.utils;

const TYPE_SOURCE = "source";
const TYPE_TARGET = "target";

var LanguagesStats = class LanguagesStats {
    constructor() {
        this._reload();
    }

    _reload() {
        this._json_data = Utils.SETTINGS.get_string(
            PrefsKeys.LANGUAGES_STATS_KEY
        );
        this._storage = JSON.parse(this._json_data);

        if (this._storage instanceof Array) {
            this._storage = {};
        }
    }

    increment(translator_name, type, lang_data) {
        let key_string = "%s-%s-%s".format(
            translator_name,
            type,
            lang_data.code
        );

        if (key_string in this._storage) {
            this._storage[key_string].count++;
        } else {
            let data = {
                lang_name: lang_data.name,
                lang_code: lang_data.code,
                count: 1
            };
            this._storage[key_string] = data;
        }

        this.save();
    }

    get_n_most_used(translator_name, type, n) {
        n = n || 5;
        let key_string = "%s-%s".format(translator_name, type);
        let keys = Object.keys(this._storage);

        let filtered = keys.filter(key => {
            if (this._storage[key].count <= 3) return false;
            return Utils.starts_with(key, key_string);
        });
        filtered.sort((a, b) => {
            return this._storage[b].count > this._storage[a].count;
        });

        let result = [];

        for (let i = 0; i < filtered.length; i++) {
            if (i >= n) break;

            let clone = JSON.parse(JSON.stringify(this._storage[filtered[i]]));
            result.push(clone);
        }

        return result.slice(0);
    }

    save() {
        Utils.SETTINGS.set_string(
            PrefsKeys.LANGUAGES_STATS_KEY,
            JSON.stringify(this._storage)
        );
        this.emit("stats-changed");
    }
};
Signals.addSignalMethods(LanguagesStats.prototype);
