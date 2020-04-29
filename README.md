## Looking for maintainer
Hi all, I'm happy to maintain this repository but I cannot work on it much as I am not using the Gnome desktop anymore.
I did not write this thing myself, I just kinda hacked it so it could still work after the creator abandoned it.
If you want to manage this repo, open an issue :)

## Text Translator

Translation of the text by different translators (currently [Google.Translate](https://translate.google.com), [Yandex.Translate](https://translate.yandex.com/)).

### Installing translate-shell

This extension needs the package translate-shell.  
Also, make sure you have the following dependencies installed:  
`sudo apt install gir1.2-clutter-1.0 gir1.2-clutter-gst-3.0 gir1.2-gtkclutter-1.0`




#### Install translate-shell
```
cd /usr/bin
sudo wget https://git.io/trans
sudo chmod a+x trans
```
For full install instructions see [translate-shell#installation](https://github.com/soimort/translate-shell#installation).
*If you have trouble using translate-shell, make sure your version of translate-shell is over 0.9.5-1, otherwise it might cause issues.*

### Installation

Go on the [Text Translator](https://extensions.gnome.org/extension/593/text-translator/) extension page, click on the switch ("OFF" => "ON"), click on the install button. That's it !

### Shortcuts

`<Super> T` - open translator dialog.  
`<Super> <Shift> T` - open translator dialog and translate text from clipboard.  
`<Super> <Alt> T` - open translator dialog and translate from primary selection (requires [xclip](http://xclip.sourceforge.net/)).
`<Ctrl> <Enter>` - translate text.  
`<Ctrl> <Shift> C` - copy translated text to clipboard.  
`<Ctrl> S` - swap languages.  
`<Ctrl> D` - reset languages to default.  
`<Tab>` - toggle transliteration of result text.

### Screenshots

#### Dialog
![Translator](/screenshots/1.png)
![Language chooser](/screenshots/3.png)

#### Settings
![Main settings](/screenshots/4.png)
![Translators settings](/screenshots/5.png)
![Keybindings](/screenshots/6.png)
