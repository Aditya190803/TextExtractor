# Text Extractor

A GNOME Shell extension that allows you to extract text from any area of your screen using OCR (Optical Character Recognition).

![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-48%20|%2049-blue)
![License](https://img.shields.io/badge/License-GPL--3.0-green)

## Features

- 📸 **Instant Native Screenshot UI**: Uses xdg-desktop-portal for fast, native screenshot selection
- 🔍 **OCR Processing**: Extract text from the selected region using Tesseract OCR
- 📝 **Interactive Text Selection**: Click on individual text regions or drag to select multiple
- 📋 **Copy to Clipboard**: Instantly copy extracted text to clipboard
- 💾 **Save to File**: Export extracted text to a text file
- ⌨️ **Keyboard Shortcuts**: Quick access with customizable keyboard shortcuts
- 🌍 **Multi-language Support**: Works with multiple OCR languages
- ⚙️ **Customizable**: Adjust overlay appearance, highlight colors, and more

## Screenshots

*Coming soon*

## Requirements

### System Dependencies

- **GNOME Shell 48 or 49** (required)
- **xdg-desktop-portal-gnome** - For native screenshot UI
- **Tesseract OCR** - The OCR engine
- **Python 3** - For the OCR helper script

### Python Dependencies

- **pytesseract** - Python wrapper for Tesseract
- **Pillow** - Python imaging library

## Installation

### 1. Install System Dependencies

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install tesseract-ocr tesseract-ocr-eng python3 python3-pip
```

#### Fedora
```bash
sudo dnf install tesseract tesseract-langpack-eng python3 python3-pip
```

#### Arch Linux
```bash
sudo pacman -S tesseract tesseract-data-eng python python-pip
```

### 2. Install Python Dependencies

```bash
pip3 install pytesseract Pillow
```

### 3. Install Additional OCR Languages (Optional)

#### Ubuntu/Debian
```bash
# List available languages
apt-cache search tesseract-ocr-

# Install specific language (e.g., German)
sudo apt install tesseract-ocr-deu

# Install all languages
sudo apt install tesseract-ocr-all
```

#### Fedora
```bash
# List available languages
dnf search tesseract-langpack-

# Install specific language
sudo dnf install tesseract-langpack-deu
```

#### Arch Linux
```bash
# Install specific language
sudo pacman -S tesseract-data-deu

# Install all languages
sudo pacman -S tesseract-data
```

### 4. Install the Extension

#### From Source

```bash
# Clone the repository
git clone https://github.com/Aditya190803/TextExtractor.git
cd TextExtractor

# Run the install script
chmod +x install.sh
./install.sh
```

#### Manual Installation

```bash
# Build and install the extension
./install.sh
```

### 5. Enable the Extension

#### On X11
1. Press `Alt+F2`, type `r`, and press Enter to restart GNOME Shell
2. Enable the extension:
   ```bash
   gnome-extensions enable text-extractor@aditya190803
   ```

#### On Wayland
1. Log out and log back in
2. Enable the extension:
   ```bash
   gnome-extensions enable text-extractor@aditya190803
   ```

Alternatively, use the **GNOME Extensions** app or **Extension Manager** to enable it.

## Usage

### Basic Usage

1. Press **Super+Shift+T** (or your configured shortcut)
2. The native GNOME screenshot UI appears instantly - select the screen region containing text
3. An overlay will appear showing detected text regions
4. Click on text regions to select them, or drag to select multiple
5. Press **Enter** or click **Copy to Clipboard** to copy the text
6. Press **ESC** or click **Close** to exit

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Super+Shift+T` | Activate Text Extractor |
| `ESC` | Close overlay |
| `Enter` | Copy selected text to clipboard |
| `Ctrl+A` | Select all text regions |
| `Ctrl+C` | Copy selected text |
| `Ctrl+S` | Save selected text to file |

### Configuration

Open the extension preferences through:
- GNOME Extensions app → Text Extractor → Settings
- Or run: `gnome-extensions prefs text-extractor@aditya190803`

#### General Settings
- **Activation Shortcut**: Customize the keyboard shortcut
- **Screenshot Directory**: Where screenshots are saved
- **Show Confirmation**: Enable/disable copy confirmation notifications

#### OCR Settings
- **Recognition Language**: Select OCR language (default: English)
- **Custom Language Code**: Enter custom Tesseract language code
- **Default Selection Mode**: Start with manual selection or select all
- **Auto Copy**: Automatically close overlay after copying

#### Appearance Settings
- **Background Opacity**: Adjust overlay darkness (0.1 - 1.0)
- **Highlight Color**: Color for text region borders
- **Font Size**: Text size in the preview panel

## Supported Languages

The extension supports all languages that Tesseract OCR supports. Common languages include:

| Language | Code |
|----------|------|
| English | `eng` |
| German | `deu` |
| French | `fra` |
| Spanish | `spa` |
| Italian | `ita` |
| Portuguese | `por` |
| Dutch | `nld` |
| Russian | `rus` |
| Japanese | `jpn` |
| Chinese (Simplified) | `chi_sim` |
| Chinese (Traditional) | `chi_tra` |
| Korean | `kor` |
| Arabic | `ara` |
| Hindi | `hin` |

To use a language, you must have the corresponding Tesseract language pack installed.

## Troubleshooting

### "Tesseract OCR is not installed"

Install Tesseract using your package manager (see Installation section).

### "pytesseract module not found"

Install the Python module:
```bash
pip3 install pytesseract
```

### "No text detected"

- Ensure the image has clear, readable text
- Try adjusting the screen region to include more context
- Check if the correct OCR language is selected

### Extension not appearing

1. Check if the extension is installed:
   ```bash
   ls ~/.local/share/gnome-shell/extensions/text-extractor@aditya190803/
   ```
2. Check GNOME Shell logs:
   ```bash
   journalctl -f -o cat /usr/bin/gnome-shell
   ```
3. Ensure GNOME Shell version is compatible (48 or 49)

### Shortcut not working

1. Check if the shortcut conflicts with other applications
2. Try resetting to default in preferences
3. Ensure the extension is enabled

## Uninstallation

```bash
# Run the uninstall script
./uninstall.sh

# Or manually remove
gnome-extensions disable text-extractor@aditya190803
rm -rf ~/.local/share/gnome-shell/extensions/text-extractor@aditya190803
```

## Development

### Project Structure

```
TextExtractor/
├── text-extractor@aditya190803/
│   ├── extension.js      # Main extension entry point
│   ├── overlay.js        # Text selection overlay UI
│   ├── prefs.js          # Preferences window
│   ├── utils.js          # Utility functions
│   ├── ocr_helper.py     # Python OCR script
│   ├── stylesheet.css    # Extension styles
│   ├── metadata.json     # Extension metadata
│   └── schemas/
│       └── org.gnome.shell.extensions.text-extractor.gschema.xml
├── install.sh            # Install & Build script
├── uninstall.sh          # Uninstall script
├── README.md             # This file
└── todo.md               # Development TODO
```

### Building from Source

```bash
# Compile schemas and create zip package
./install.sh

# The extension package will be at:
# build/text-extractor@aditya190803.zip
```

### Testing Changes

```bash
# After making changes, reinstall
./install.sh

# Restart GNOME Shell (X11)
# Press Alt+F2, type 'r', press Enter

# Check logs for errors
journalctl -f -o cat /usr/bin/gnome-shell
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Credits

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) - The OCR engine
- [pytesseract](https://github.com/madmaze/pytesseract) - Python wrapper for Tesseract
- GNOME Shell team for the excellent extension API

## Author

**Aditya** - [GitHub](https://github.com/Aditya190803)

---

If you find this extension useful, please consider giving it a ⭐ on GitHub!
