const Lang = imports.lang;
const Extension = imports.misc.extensionUtils.get_text_translator_extension();
const TranslationProviderBase = Extension.imports.translation_provider_base;

const ENGINE = "Yandex";

var Translator = class Yandex extends TranslationProviderBase.TranslationProviderBase {
  constructor() {
    super(ENGINE + ".Translate");
    this.engine = ENGINE;
    this.NAME = ENGINE;
  }
};

Translator.NAME = ENGINE;
