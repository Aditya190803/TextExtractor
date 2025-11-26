# Text Extractor - Simplified Workflow

## New Workflow (No UI)
User presses shortcut → Selects screen area → Screenshot saved → OCR extracts ALL text → Auto-copy to clipboard → Notification

## Tasks

### 1. Screenshot Storage
- [x] Create folder: `~/Pictures/TextExtractor/`
- [x] Save with timestamp: `text-extract-YYYY-MM-DD_HH-MM-SS.png`
- [x] Keep images permanently (don't delete)

### 2. Simplify Extension
- [x] Remove overlay.js import and usage
- [x] Take screenshot via xdg-desktop-portal
- [x] Move screenshot from temp to `~/Pictures/TextExtractor/`
- [x] Run OCR on entire image
- [x] Extract ALL text (no selection needed)
- [x] Auto-copy to clipboard
- [x] Show notification with result

### 3. Cleanup
- [x] Delete overlay.js (not needed)
- [x] Remove selection.js (not needed)
- [x] Simplify extension.js

## Files
- **extension.js** - Main logic (simplified)
- **ocr_helper.py** - OCR script (keep as-is)
- **metadata.json** - Extension metadata
- **prefs.js** - Preferences (optional)
