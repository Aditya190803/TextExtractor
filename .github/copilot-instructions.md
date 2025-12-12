# Text Extractor - AI Coding Agent Instructions

## Project Overview
GNOME Shell extension for OCR-based text extraction. User presses `Super+Shift+T` → selects screen area → text auto-copied to clipboard via Tesseract OCR.

**Architecture split**: Extension runs in GNOME Shell (JavaScript/GJS), OCR processing via external Python helper (`text-extractor-ocr`) installed to `~/.local/bin/`.

## Key Components

### Extension Architecture (`build/extension.js`)
- **Main class**: `TextExtractorExtension extends Extension`
- **Lifecycle**: `enable()` registers keybinding + creates screenshot dir, `disable()` cleans up subprocess/cancellable/keybinding
- **Critical pattern**: In `disable()`, ALWAYS cancel `_cancellable` BEFORE calling `_subprocess.force_exit()` (EGO requirement)
- **Screenshot flow**: Uses xdg-desktop-portal DBus API (`org.freedesktop.portal.Screenshot`) with handle_token pattern, NOT gnome-screenshot
- **OCR execution**: Spawns `text-extractor-ocr` via `Gio.Subprocess`, parses JSON output with `{success, lines, text}` structure
- **Processing state**: `_isProcessing` flag prevents concurrent screenshot requests

### Python OCR Helper (`build/ocr_helper.py`)
- **Location**: Installed as system-wide script to `~/.local/bin/text-extractor-ocr` (NOT bundled in extension)
- **Interface**: `text-extractor-ocr <image_path> <language>` → outputs JSON to stdout
- **JSON schema**: `{success: bool, text: str, lines: [{text, x, y, width, height}], regions: [...]}`
- **Dependencies**: `pytesseract`, `Pillow`, tesseract binary

### Preferences UI (`build/prefs.js`)
- **Framework**: GTK4 + libadwaita (`Adw.PreferencesPage`)
- **Settings binding**: Use `settings.bind()` for switches, manual handlers for ComboRow/EntryRow
- **Shortcut dialog**: Custom `Gtk.Dialog` with `Gtk.EventControllerKey` for keybinding capture
- **Pattern**: Access settings via `this.getSettings()` (from `ExtensionPreferences`)

### Settings Schema (`build/schemas/org.gnome.shell.extensions.text-extractor.gschema.xml`)
- Keys: `shortcut` (as), `ocr-language` (s), `show-notification` (b), `save-screenshots` (b)
- **Compilation**: Run `glib-compile-schemas` during installation (NOT in source tree)

## Build & Installation

### Installation Flow (`install.sh`)
1. Detect package manager (apt/dnf/pacman) and install system deps (tesseract, python3, pip, zip)
2. Install Python packages (`pytesseract`, `Pillow`) via `pip3 install --user`
3. **Build**: Create `text-extractor@aditya190803.zip` from `build/` directory
4. **Install**: Copy files to `~/.local/share/gnome-shell/extensions/text-extractor@aditya190803/` EXCEPT `ocr_helper.py`
5. **OCR helper**: Copy `ocr_helper.py` → `~/.local/bin/text-extractor-ocr` (chmod +x)
6. Add `~/.local/bin` to PATH in `.bashrc`, `.zshrc`, `.profile`
7. Compile GSettings schemas in installation directory

### Uninstallation (`uninstall.sh`)
- Disable extension via `gnome-extensions disable`
- Remove extension dir and `~/.local/bin/text-extractor-ocr`

### No traditional build system
- No npm/make/meson - pure shell scripts for installation
- To test changes: modify `build/` files, run `./install.sh`, restart GNOME Shell (Alt+F2 → 'r' on X11, logout on Wayland)

## Development Patterns

### GNOME Extension Conventions
- **Imports**: Use GI namespaces (`import GLib from 'gi://GLib'`) and resources (`from 'resource://...'`)
- **Keybindings**: Register via `Main.wm.addKeybinding()` with schema key, ALWAYS unregister in `disable()`
- **Settings**: Access via `this.getSettings()`, disconnect signals in `disable()`
- **Notifications**: Use `Main.notify(title, message)`, respect `show-notification` setting

### Subprocess Management (CRITICAL)
```javascript
// Correct pattern (from extension.js)
if (this._cancellable && !this._cancellable.is_cancelled()) {
    this._cancellable.cancel();  // Cancel FIRST
}
if (this._subprocess) {
    this._subprocess.force_exit();  // Then force exit
    this._subprocess = null;
}
```

### DBus Portal Integration
- **Pattern**: Create unique request path with handle_token, subscribe to Response signal BEFORE calling portal method
- **Timeout**: 120s for screenshot (user selection time), cleanup signal on timeout/response
- **Response codes**: 0=success (has 'uri'), 1=cancelled, else=error
- Example at `extension.js:136-250` (`_takePortalScreenshot`)

### Error Handling
- Log errors with `console.error('[TextExtractor] <context>: ${e.message}')`
- Show user-facing errors via `_showNotification('Error Title', message)`
- OCR helper errors: Check stderr output, fallback to English if language unavailable

## File Locations
- **Extension files**: `build/extension.js`, `build/prefs.js`, `build/metadata.json`, `build/stylesheet.css`
- **OCR helper**: `build/ocr_helper.py` (source), installed to `~/.local/bin/text-extractor-ocr`
- **Schema**: `build/schemas/org.gnome.shell.extensions.text-extractor.gschema.xml`
- **Installation**: `~/.local/share/gnome-shell/extensions/text-extractor@aditya190803/` (user)
- **Screenshots**: `~/Pictures/Screenshots/TextExtractor/` (created by extension)

## Testing Workflow
1. **Manual testing**: Install extension, test with `Super+Shift+T`, check GNOME logs:
   ```bash
   journalctl -f -o cat /usr/bin/gnome-shell
   ```
2. **Check OCR helper**: `text-extractor-ocr /path/to/image.png eng` (should output JSON)
3. **Preferences**: `gnome-extensions prefs text-extractor@aditya190803`
4. **No automated tests** - validation is runtime in GNOME environment

## Common Tasks

### Add new language
1. Update language list array in `prefs.js` (lines 79-94, add to `langCodes` array)
2. User installs Tesseract language pack: `sudo apt install tesseract-ocr-<code>`

### Modify OCR behavior
- Edit `build/ocr_helper.py` → reinstall via `./install.sh`
- Extension spawns helper at `extension.js:301` via `Gio.Subprocess.new()`

### Change screenshot location
- Modify `_ensureScreenshotDir()` in `extension.js:89-102`
- Update README and preferences subtitle

### Debug subprocess issues
- Check if `text-extractor-ocr` is in PATH: `which text-extractor-ocr`
- Test manually: `text-extractor-ocr /tmp/test.png eng | python3 -m json.tool`
- Check GNOME Shell logs for subprocess errors

## EGO (GNOME Extensions) Compliance Notes
- ✅ External scripts installed to `~/.local/bin` (not bundled)
- ✅ No compiled schemas in source tree
- ✅ Subprocess cancellation order: cancel → force_exit
- ✅ Logging uses `console.error` for errors only (no debug spam)
- ✅ Timeouts properly removed before creating new ones
- ❌ Do NOT bundle binaries or scripts in extension package

## Version Support
- **GNOME Shell**: 48, 49 (defined in `metadata.json`)
- **API changes**: None between 48-49 for this extension
- **Compatibility**: Uses stable APIs (Gio.Subprocess, xdg-desktop-portal, GTK4/Adw)
