# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-26

### Added
- **Instant Native Screenshot UI**: Uses xdg-desktop-portal for fast, native screenshot selection
- **Automatic Text Extraction**: OCR processing of entire screenshot with auto-copy to clipboard
- **Multi-language Support**: 18+ OCR languages (English, German, French, Spanish, Italian, Portuguese, Dutch, Russian, Japanese, Chinese, Korean, Arabic, Hindi, Polish, Turkish, Vietnamese, Thai)
- **Customizable Keyboard Shortcut**: Configurable default Super+Shift+T
- **Comprehensive Preferences UI**: Full GTK4 preferences window with multiple pages
  - General settings: Keyboard shortcut, screenshot directory, notifications
  - OCR settings: Language selection, custom language codes, selection mode
  - Appearance settings: Overlay opacity, highlight color, font size
- **Screenshot Storage**: Automatic storage in ~/Pictures/TextExtractor/ with timestamps
- **Multiple Output Modes**: Copy to clipboard, save to file, selection options
- **Extensive Logging**: Console logging for debugging

### Changed
- **Complete Restructure**: Migrated from old overlay-based system to simplified portal-based approach
- **Removed GTK4 Helper**: Replaced complex GTK4 helper script with Python OCR helper
- **Simplified Workflow**: No complex UI overlays, just take screenshot → extract → copy
- **Improved Directory Structure**: New `text-extractor@aditya190803` directory format
- **Better Error Handling**: User-friendly error messages and notifications

### Removed
- Old overlay.js and selection.js UI system
- GTK4-based helper script (helper/text-extractor-helper.py)
- Complex text selection UI
- Manual text selection requirement

### Fixed
- Language fallback behavior for unsupported languages
- Timeout handling for screenshot portal
- File operations error handling

### Technical
- GNOME Shell 48+ compatible
- Uses xdg-desktop-portal API
- Improved GSettings schema
- Better subprocess management
- Enhanced Tesseract integration

## [1.0.0] - 2025-11-XX

### Added
- Initial release of Text Extractor extension
- Basic OCR functionality using Tesseract
- Screenshot capture and text extraction
- GTK4-based UI for text selection
