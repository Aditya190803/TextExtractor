# Text Extractor

A GNOME Shell extension that extracts text from any area of your screen using OCR (Optical Character Recognition).

![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-48%20|%2049-blue)
![License](https://img.shields.io/badge/License-GPL--3.0-green)
![Version](https://img.shields.io/badge/Version-1.2.0-orange)

## Features

- 📸 **Native Screenshot UI**: Uses GNOME's built-in screenshot selection
- 🔍 **Automatic OCR**: Extracts text and copies to clipboard automatically
- 🌍 **Multi-language Support**: 14+ OCR languages supported
- ⌨️ **Customizable Shortcut**: Default `Super+Shift+T`
- 💾 **Optional Screenshot Storage**: Save or auto-delete after OCR
- 🔔 **Notifications**: Optional success/error notifications

## How It Works

1. Press **Super+Shift+T**
2. Select screen area using native GNOME screenshot UI
3. Text is extracted via OCR and **automatically copied to clipboard**
4. Done! Paste anywhere with `Ctrl+V`

## Requirements

- **GNOME Shell 48 or 49**
- **Tesseract OCR**
- **Python 3** with `pytesseract` and `Pillow`

## Installation

### 1. Install Extension

```bash
git clone https://github.com/Aditya190803/TextExtractor.git
cd TextExtractor
chmod +x install.sh
./install.sh
```

The installation script will:
- Install **Tesseract OCR** and Python dependencies automatically on Debian/Ubuntu, Fedora, and Arch
- Install the extension to `~/.local/share/gnome-shell/extensions/`
- Install the OCR helper script automatically and make it available to GNOME Shell
- Compile GSettings schemas

If your distribution is not supported by the installer, install `tesseract`, `python3`, `python3-pip`, and `zip` manually first, then run `./install.sh` again.

### 2. Enable Extension

```bash
# On X11: Press Alt+F2, type 'r', press Enter
# On Wayland: Log out and log back in

gnome-extensions enable text-extractor@aditya190803
```

Or use **GNOME Extensions** app / **Extension Manager**.

## Configuration

Open preferences via:
- GNOME Extensions app → Text Extractor → ⚙️
- Or: `gnome-extensions prefs text-extractor@aditya190803`

### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Shortcut** | Keyboard shortcut to trigger | `Super+Shift+T` |
| **OCR Language** | Language for text recognition | English (`eng`) |
| **Show Notifications** | Display result notifications | ✓ Enabled |
| **Save Screenshots** | Keep screenshots after OCR | ✓ Enabled |

Screenshots are saved to `~/Pictures/Screenshots/TextExtractor/`

## Supported Languages

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | `eng` | Russian | `rus` |
| German | `deu` | Japanese | `jpn` |
| French | `fra` | Chinese (Simplified) | `chi_sim` |
| Spanish | `spa` | Chinese (Traditional) | `chi_tra` |
| Italian | `ita` | Korean | `kor` |
| Portuguese | `por` | Arabic | `ara` |
| Dutch | `nld` | Hindi | `hin` |
| Turkish | `tur` | | |

Install additional languages:
```bash
# Ubuntu/Debian
sudo apt install tesseract-ocr-<code>

# Fedora  
sudo dnf install tesseract-langpack-<code>

# Arch
sudo pacman -S tesseract-data-<code>
```

## Troubleshooting

### No text detected
- Ensure image has clear, readable text
- Try selecting a larger area
- Check OCR language setting

### Extension not working
```bash
# Check if installed
ls ~/.local/share/gnome-shell/extensions/text-extractor@aditya190803/

# Check logs
journalctl -f -o cat /usr/bin/gnome-shell
```

### Shortcut conflicts
Reset to default in extension preferences.

## Uninstallation

```bash
./uninstall.sh
```

Or manually:
```bash
gnome-extensions disable text-extractor@aditya190803
rm -rf ~/.local/share/gnome-shell/extensions/text-extractor@aditya190803
rm ~/.local/bin/text-extractor-ocr
```

## Project Structure

```
TextExtractor/
├── build/                # Extension source files
│   ├── extension.js      # Main extension logic
│   ├── prefs.js          # Preferences UI
│   ├── ocr_helper.py     # Python OCR script (installed to ~/.local/bin)
│   ├── stylesheet.css    # Styles
│   ├── metadata.json     # Extension metadata
│   └── schemas/          # GSettings schema
├── install.sh            # Installation script
├── uninstall.sh          # Uninstallation script
├── LICENSE
└── README.md
```

**Note**: The `ocr_helper.py` script is installed as a system-wide dependency at `~/.local/bin/text-extractor-ocr` and is not bundled with the extension package, following [EGO Review Guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html#scripts-and-binaries).

## License

[GNU General Public License v3.0](LICENSE)

## Credits

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [pytesseract](https://github.com/madmaze/pytesseract)
- GNOME Shell Extension API

## Author

**Aditya** - [GitHub](https://github.com/Aditya190803)

---

⭐ Star this repo if you find it useful!
