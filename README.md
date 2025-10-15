# Text Extractor GNOME Extension

A lightweight GNOME Shell extension that enables quick text extraction from any area of your screen using OCR (Optical Character Recognition). Similar to Windows PowerToys Text Extractor, but for Linux GNOME environments.

**Author:** Aditya Mer
**Version:** 1.0
**Tested on:** GNOME Shell 47, Arch Linux

## Features

- **Quick Keyboard Shortcut**: Press `Super+Shift+T` to instantly capture and extract text
- **Area Selection**: Select any region of your screen to extract text from
- **OCR Processing**: Powered by Tesseract OCR for accurate text recognition
- **Text Selection GUI**: Review and select specific portions of extracted text
- **Clipboard Integration**: Copy all or selected text with one click
- **Multi-language Support**: Configure OCR language via GSettings
- **Wayland & X11 Compatible**: Works on both display servers

## Screenshots

Press `Super+Shift+T` → Select area → View extracted text → Copy to clipboard

## Installation

### Prerequisites

#### Arch Linux
```bash
sudo pacman -S python-pillow python-pytesseract tesseract python-pyperclip python-gobject gtk4 gnome-screenshot
```

#### Ubuntu/Debian
```bash
sudo apt install python3-pil python3-pytesseract tesseract-ocr python3-pyperclip python3-gi gir1.2-gtk-4.0 gnome-screenshot
```

#### Fedora
```bash
sudo dnf install python3-pillow python3-pytesseract tesseract python3-pyperclip python3-gobject gtk4 gnome-screenshot
```

### Install Extension

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/aditya190803/text-extractor.git
   cd text-extractor
   ```

2. **Run the installation script**
   ```bash
   ./install.sh
   ```

3. **Restart GNOME Shell**
   - **X11**: Press `Alt+F2`, type `r`, press `Enter`
   - **Wayland**: Log out and log back in

4. **Enable the extension**
   ```bash
   gnome-extensions enable text-extractor@aditya190803
   ```

## Usage

### Basic Usage

1. Press `Super+Shift+T` (Windows key + Shift + T)
2. Click and drag to select the area containing text
3. Wait a moment for OCR processing
4. A window appears with the extracted text
5. Select specific text or leave as-is to copy all
6. Click "Copy Selected Text" button
7. Paste the text anywhere with `Ctrl+V`

### Customizing the Keyboard Shortcut

Using GNOME Settings:
1. Open **Settings** → **Keyboard** → **View and Customize Shortcuts**
2. Search for "Text Extractor"
3. Click on the shortcut and press your desired key combination

Using command line:
```bash
gsettings set org.gnome.shell.extensions.text-extractor text-extractor-shortcut "['<Super><Shift>e']"
```

### Changing OCR Language

By default, English (`eng`) is used. To change:

```bash
gsettings set org.gnome.shell.extensions.text-extractor ocr-language 'fra'
```

Available languages depend on installed Tesseract language packs:
- English: `eng` (default)
- Spanish: `spa`
- French: `fra`
- German: `deu`
- Chinese Simplified: `chi_sim`
- Arabic: `ara`

Install additional languages on Arch:
```bash
sudo pacman -S tesseract-data-<language>
```

## File Structure

```
text-extractor/
├── extension/
│   ├── extension.js              # Main GNOME Shell extension
│   ├── metadata.json             # Extension metadata
│   └── schemas/
│       └── org.gnome.shell.extensions.text-extractor.gschema.xml
├── helper/
│   └── text-extractor-helper.py  # Python script for screenshot + OCR + GUI
├── install.sh                     # Installation script
└── README.md                      # This file
```

## How It Works

1. **GNOME Shell Extension** (extension.js):
   - Registers the keyboard shortcut
   - Listens for shortcut activation
   - Spawns the Python helper script

2. **Python Helper** (text-extractor-helper.py):
   - Captures screenshot using `gnome-screenshot -a`
   - Performs OCR using Tesseract via `pytesseract`
   - Displays GTK4 window with extracted text
   - Handles clipboard operations with `pyperclip`
   - Cleans up temporary files

## Troubleshooting

### Extension not showing up
```bash
gnome-extensions list
```
If not listed, verify installation directory:
```bash
ls ~/.local/share/gnome-shell/extensions/text-extractor@aditya190803/
```

### Shortcut not working
Check if the shortcut is properly registered:
```bash
gsettings get org.gnome.shell.extensions.text-extractor text-extractor-shortcut
```

### OCR returns no text
- Ensure the selected area contains clear, readable text
- Try increasing the size of the capture area
- Verify Tesseract is installed: `tesseract --version`
- Check if the correct language pack is installed

### Screenshot fails
- Verify gnome-screenshot is installed: `which gnome-screenshot`
- On Wayland, ensure proper permissions for screen capture
- Try running manually: `gnome-screenshot -a`

### Python errors
Check Python dependencies:
```bash
python3 -c "import PIL, pytesseract, pyperclip, gi"
```

View extension logs:
```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

## Uninstallation

```bash
gnome-extensions disable text-extractor@aditya190803
rm -rf ~/.local/share/gnome-shell/extensions/text-extractor@aditya190803
rm -f ~/.local/share/gnome-shell/extensions/helper/text-extractor-helper.py
```

Then restart GNOME Shell.

## Future Enhancements

- [ ] Language selection from GUI
- [ ] History of extracted text
- [ ] Dark/light theme support
- [ ] Direct PipeWire API integration for Wayland
- [ ] Quick Settings toggle
- [ ] Confidence score display
- [ ] Export to file option

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License

Copyright (c) 2025 Aditya Mer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Acknowledgments

- Inspired by Windows PowerToys Text Extractor
- Built with [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- Uses [GTK4](https://www.gtk.org/) for the user interface

## Support

For issues, questions, or suggestions:
- GitHub Issues: https://github.com/aditya190803/text-extractor/issues
- Author: Aditya Mer

---

**Enjoy extracting text from your screen!** 📋✨
