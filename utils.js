/*
 * Part of this file comes from gnome-shell-extensions:
 * http://git.gnome.org/browse/gnome-shell-extensions/
 */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const Soup = imports.gi.Soup;
const Clutter = imports.gi.Clutter;

var _httpSession = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(
  _httpSession,
  new Soup.ProxyResolverDefault()
);
_httpSession.user_agent = "Gnome-Shell TextTranslator Extension";
_httpSession.timeout = 5;

var SETTINGS = getSettings();

var ICONS = {
  help: "dialog-question-symbolic",
  preferences: "preferences-system-symbolic",
  close: "window-close-symbolic",
  shutdown: "system-shutdown-symbolic",
  instant_translation: "object-select-symbolic",
  listen: "audio-volume-high-symbolic"
};

function is_blank(str) {
  return !str || /^\s*$/.test(str);
}

function starts_with(str1, str2) {
  return str1.slice(0, str2.length) == str2;
}

function ends_with(str1, str2) {
  return str1.slice(-str2.length) == str2;
}

function escape_html(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * getSettings:
 * @schema: (optional): the GSettings schema id
 *
 * Builds and return a GSettings schema for @schema, using schema files
 * in extensionsdir/schemas. If @schema is not provided, it is taken from
 * metadata['settings-schema'].
 */
function getSettings(schema) {
  let extension = ExtensionUtils.getCurrentExtension();

  schema = schema || extension.metadata["settings-schema"];

  const GioSSS = Gio.SettingsSchemaSource;

  // check if this extension was built with "make zip-file", and thus
  // has the schema files in a subfolder
  // otherwise assume that extension has been installed in the
  // same prefix as gnome-shell (and therefore schemas are available
  // in the standard folders)
  let schemaDir = extension.dir.get_child("schemas");
  let schemaSource;

  if (schemaDir.query_exists(null)) {
    schemaSource = GioSSS.new_from_directory(
      schemaDir.get_path(),
      GioSSS.get_default(),
      false
    );
  } else {
    schemaSource = GioSSS.get_default();
  }

  let schemaObj = schemaSource.lookup(schema, true);

  if (!schemaObj)
    throw new Error(
      "Schema " +
        schema +
        " could not be found for extension " +
        extension.metadata.uuid +
        ". Please check your installation."
    );

  return new Gio.Settings({ settings_schema: schemaObj });
}

function get_files_in_dir(path) {
  let dir = Gio.file_new_for_path(path);
  let file_enum, info;
  let result = [];

  try {
    file_enum = dir.enumerate_children(
      "standard::*",
      Gio.FileQueryInfoFlags.NONE,
      null
    );
  } catch (e) {
    log(e);
    return false;
  }

  while ((info = file_enum.next_file(null)) != null) {
    let file_type = info.get_file_type();

    if (file_type != Gio.FileType.REGULAR) continue;

    let file_name = info.get_name();
    result.push(file_name);
  }

  file_enum.close(null);

  return result;
}

function get_unichar(keyval) {
  let ch = Clutter.keysym_to_unicode(keyval);

  if (ch) {
    return String.fromCharCode(ch);
  } else {
    return false;
  }
}

// http://stackoverflow.com/a/7654602
var asyncLoop = function(o) {
  var i = -1;

  var loop = function() {
    i++;
    if (i == o.length) {
      o.callback();
      return;
    }
    o.functionToLoop(loop, i);
  };

  loop(); //init
};
