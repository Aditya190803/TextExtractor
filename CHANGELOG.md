# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-11-26

### Initial Release 🎉

First official release of Text Extractor for GNOME Shell.

### Features
- **Instant Screenshot Selection**: Uses native GNOME screenshot UI (xdg-desktop-portal)
- **Automatic OCR**: Extracts text using Tesseract OCR and copies to clipboard
- **Multi-language Support**: 14+ OCR languages (English, German, French, Spanish, Italian, Portuguese, Dutch, Russian, Japanese, Chinese, Korean, Arabic, Hindi)
- **Customizable Shortcut**: Default `Super+Shift+T`, fully configurable
- **Preferences UI**: Clean GTK4/Adw settings window
- **Screenshot Storage**: Optional - save to `~/Pictures/TextExtractor/` or delete after OCR
- **Notifications**: Optional success/error notifications

### Requirements
- GNOME Shell 48 or 49
- Tesseract OCR
- Python 3 with pytesseract and Pillow

### Installation
```bash
git clone https://github.com/Aditya190803/TextExtractor.git
cd TextExtractor
./install.sh
gnome-extensions enable text-extractor@aditya190803
```
