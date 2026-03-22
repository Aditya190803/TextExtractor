# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2026-03-22

### Changed
- Installer now detects the host Linux distro/package manager and installs Tesseract plus the Python OCR bindings from distro packages when available
- README now reflects the distro-packaged Python OCR dependency model

### Fixed
- Removed the runtime fallback that tried to install `pytesseract` and `Pillow` with `pip` during installation

## [1.2.0] - 2026-03-08

### Added
- Native GNOME Shell screenshot UI flow for GNOME Shell 48 and 49, avoiding environments where the desktop portal screenshot interface is unavailable

### Changed
- Release packaging now excludes the external OCR helper and Python cache files from the GNOME Extensions upload archive

### Fixed
- Screenshot UI signal cleanup now disconnects extension-owned handlers during shutdown and after screenshot completion

## [1.1.0] - 2026-03-07

### Changed - EGO Review Compliance
- **OCR Helper as System Dependency**: `ocr_helper.py` now installs to `~/.local/bin/text-extractor-ocr` instead of being bundled with the extension package, following [EGO Review Guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html#scripts-and-binaries)
- **Improved Subprocess Management**: Enhanced subprocess cancellation in `disable()` method with proper ordering (cancel before force_exit) as recommended by [GJS Guide](https://gjs.guide/guides/gio/subprocesses.html#cancellable-processes)
- Updated `install.sh` and `uninstall.sh` scripts to handle external OCR helper installation
- Updated README with installation notes about `~/.local/bin` in PATH

### Fixed
- Proper cleanup order: cancellable checked and cancelled before subprocess force_exit
- Better error handling when OCR helper is not found in PATH

### Notes
- No unnecessary files shipped (no `text-extractor@aditya190803` folder in source)
- No compiled schemas (`gschemas.compiled`) in source - compiled during installation
- All logging uses `console.error` appropriately for error conditions only
- Timeout properly removed before creating new one (already compliant)

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
