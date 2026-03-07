/**
 * Text Extractor - GNOME Shell Extension
 * Extract text from screen regions using OCR
 * 
 * Simplified workflow:
 * 1. User presses shortcut (Super+Shift+T)
 * 2. Native screenshot UI opens (select area)
 * 3. Screenshot saved to ~/Pictures/TextExtractor/
 * 4. OCR extracts ALL text
 * 5. Text auto-copied to clipboard
 * 6. Notification shows result
 * 
 * Supported: GNOME Shell 48 and 49
 */

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class TextExtractorExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._settings = null;
        this._loadingIndicator = null;
        this._isProcessing = false;
        this._requestCounter = 0;
        this._screenshotDir = null;
        this._cancellable = null;
        this._subprocess = null;
        this._portalTimeoutId = null;
    }

    enable() {
        this._settings = this.getSettings();
        
        // Create screenshot directory
        this._ensureScreenshotDir();
        
        // Register keybinding
        this._registerKeybinding();
        
        // Watch for shortcut changes
        this._shortcutChangedId = this._settings.connect('changed::shortcut', () => {
            this._unregisterKeybinding();
            this._registerKeybinding();
        });
    }

    disable() {
        this._cancellable?.cancel();
        this._cancellable = null;

        if (this._portalTimeoutId) {
            GLib.source_remove(this._portalTimeoutId);
            this._portalTimeoutId = null;
        }

        // Remove loading indicator if showing
        this._hideLoadingIndicator();
        
        // Disconnect settings signal
        if (this._shortcutChangedId) {
            this._settings.disconnect(this._shortcutChangedId);
            this._shortcutChangedId = null;
        }
        
        // Unregister keybinding
        this._unregisterKeybinding();
        
        this._settings = null;
        this._isProcessing = false;
    }

    _ensureScreenshotDir() {
        // Create ~/Pictures/Screenshots/TextExtractor/
        const picturesDir = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES);
        this._screenshotDir = GLib.build_filenamev([picturesDir, 'Screenshots', 'TextExtractor']);
        
        const dir = Gio.File.new_for_path(this._screenshotDir);
        if (!dir.query_exists(null)) {
            try {
                dir.make_directory_with_parents(null);
            } catch (e) {
                console.error(`[TextExtractor] Failed to create directory: ${e.message}`);
            }
        }
    }

    _registerKeybinding() {
        Main.wm.addKeybinding(
            'shortcut',
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            this._onShortcutPressed.bind(this)
        );
    }

    _unregisterKeybinding() {
        Main.wm.removeKeybinding('shortcut');
    }

    _getOcrHelperPath() {
        const pathFromEnv = GLib.find_program_in_path('text-extractor-ocr');
        if (pathFromEnv) {
            return pathFromEnv;
        }

        const homeDir = GLib.get_home_dir();
        const fallbackPaths = [
            GLib.build_filenamev([homeDir, '.local', 'bin', 'text-extractor-ocr']),
            '/usr/local/bin/text-extractor-ocr',
            '/usr/bin/text-extractor-ocr',
        ];

        return fallbackPaths.find(path => GLib.file_test(path, GLib.FileTest.IS_EXECUTABLE)) ?? null;
    }

    _onShortcutPressed() {
        // Prevent triggering while already processing
        if (this._isProcessing) {
            return;
        }
        
        this._takePortalScreenshot();
    }

    _shouldUseShellFallback(error) {
        const message = error?.message ?? '';

        return message.includes('org.freedesktop.DBus.Error.UnknownMethod') ||
            message.includes('No such interface “org.freedesktop.portal.Screenshot”') ||
            message.includes('No such interface "org.freedesktop.portal.Screenshot"') ||
            message.includes('org.freedesktop.portal.Desktop was not provided');
    }

    _generateFilename() {
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/T/, '_')
            .replace(/:/g, '-')
            .replace(/\..+/, '');
        return `text-extract-${timestamp}.png`;
    }

    async _takeShellScreenshot() {
        return await new Promise((resolve, reject) => {
            Gio.DBus.session.call(
                'org.gnome.Shell.Screenshot',
                '/org/gnome/Shell/Screenshot',
                'org.gnome.Shell.Screenshot',
                'InteractiveScreenshot',
                null,
                GLib.VariantType.new('(bs)'),
                Gio.DBusCallFlags.NONE,
                -1,
                null,
                (connection, res) => {
                    try {
                        const [success, uri] = connection.call_finish(res).recursiveUnpack();

                        if (!success || !uri) {
                            resolve(null);
                            return;
                        }

                        resolve(uri);
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });
    }

    async _processScreenshotUri(result) {
        if (!result) {
            this._isProcessing = false;
            return;
        }

        // Show processing indicator
        this._showLoadingIndicator('Extracting text...');

        // Move screenshot into our folder and clean up the original copy so we
        // don't leave clutter in the default screenshots directory.
        const srcFile = result.includes('://')
            ? Gio.File.new_for_uri(result)
            : Gio.File.new_for_path(result);
        const destPath = GLib.build_filenamev([this._screenshotDir, this._generateFilename()]);
        const destFile = Gio.File.new_for_path(destPath);
        let finalPath = destPath;

        try {
            // Prefer move to avoid duplicates; fall back to copy.
            srcFile.move(destFile, Gio.FileCopyFlags.OVERWRITE, null, null);
        } catch (moveErr) {
            try {
                srcFile.copy(destFile, Gio.FileCopyFlags.OVERWRITE, null, null);
                // Remove the original screenshot once we have our copy.
                try {
                    srcFile.delete(null);
                } catch (deleteErr) {
                    console.error(`[TextExtractor] Failed to delete screenshot: ${deleteErr.message}`);
                }
            } catch (copyErr) {
                console.error(`[TextExtractor] Failed to copy screenshot: ${copyErr.message}`);
                finalPath = srcFile.get_path();
            }
        }

        // Fallback to source path if move/copy failed for any reason.
        if (!finalPath) {
            finalPath = srcFile.get_path();
        }

        if (!finalPath) {
            throw new Error('No valid screenshot path found after capture');
        }

        // Run OCR on the screenshot (either moved copy or original path).
        await this._runOCR(finalPath);
    }

    async _takePortalScreenshot() {
        this._isProcessing = true;
        
        try {
            // Generate unique request token
            this._requestCounter++;
            const token = `textextractor${this._requestCounter}`;
            const sender = Gio.DBus.session.get_unique_name().substring(1).replace(/\./g, '_');
            const requestPath = `/org/freedesktop/portal/desktop/request/${sender}/${token}`;

            // Set up response listener BEFORE making the call
            const result = await new Promise((resolve, reject) => {
                let signalId = null;
                
                const cleanup = () => {
                    if (this._portalTimeoutId) {
                        GLib.source_remove(this._portalTimeoutId);
                        this._portalTimeoutId = null;
                    }
                    if (signalId) {
                        Gio.DBus.session.signal_unsubscribe(signalId);
                        signalId = null;
                    }
                };
                
                // Connect to the portal's Response signal
                signalId = Gio.DBus.session.signal_subscribe(
                    'org.freedesktop.portal.Desktop',
                    'org.freedesktop.portal.Request',
                    'Response',
                    requestPath,
                    null,
                    Gio.DBusSignalFlags.NO_MATCH_RULE,
                    (connection, senderName, objectPath, interfaceName, signalName, parameters) => {
                        cleanup();
                        
                        try {
                            const [response, results] = parameters.recursiveUnpack();
                            
                            if (response === 0) {
                                // Success - get the URI
                                const uri = results['uri'];
                                if (uri) {
                                    resolve(uri);
                                } else {
                                    reject(new Error('No URI in response'));
                                }
                            } else if (response === 1) {
                                // User cancelled
                                resolve(null);
                            } else {
                                reject(new Error(`Portal returned error code: ${response}`));
                            }
                        } catch (e) {
                            console.error(`[TextExtractor] Error parsing response: ${e.message}`);
                            reject(e);
                        }
                    }
                );
                
                // Timeout after 120 seconds (user might take time selecting)
                if (this._portalTimeoutId) {
                    GLib.source_remove(this._portalTimeoutId);
                }
                this._portalTimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 120, () => {
                    this._portalTimeoutId = null;
                    cleanup();
                    reject(new Error('Screenshot request timed out'));
                    return GLib.SOURCE_REMOVE;
                });
                
                // Build the options
                const options = {
                    'handle_token': GLib.Variant.new_string(token),
                    'interactive': GLib.Variant.new_boolean(true),
                    'modal': GLib.Variant.new_boolean(true),
                };
                
                // Build full parameters: (s, a{sv})
                const params = GLib.Variant.new_tuple([
                    GLib.Variant.new_string(''),
                    GLib.Variant.new_array(
                        GLib.VariantType.new('{sv}'),
                        Object.entries(options).map(([key, value]) => 
                            GLib.Variant.new_dict_entry(
                                GLib.Variant.new_string(key),
                                GLib.Variant.new_variant(value)
                            )
                        )
                    ),
                ]);
                
                // Make the DBus call
                Gio.DBus.session.call(
                    'org.freedesktop.portal.Desktop',
                    '/org/freedesktop/portal/desktop',
                    'org.freedesktop.portal.Screenshot',
                    'Screenshot',
                    params,
                    GLib.VariantType.new('(o)'),
                    Gio.DBusCallFlags.NONE,
                    -1,
                    null,
                    (connection, res) => {
                        try {
                            connection.call_finish(res);
                        } catch (e) {
                            cleanup();
                            console.error(`[TextExtractor] DBus call error: ${e.message}`);
                            reject(e);
                        }
                    }
                );
            });
            
            await this._processScreenshotUri(result);
        } catch (e) {
            if (this._shouldUseShellFallback(e)) {
                try {
                    const fallbackResult = await this._takeShellScreenshot();
                    await this._processScreenshotUri(fallbackResult);
                    return;
                } catch (fallbackError) {
                    e = fallbackError;
                }
            }

            console.error(`[TextExtractor] Screenshot error: ${e.message}`);
            this._hideLoadingIndicator();
            this._isProcessing = false;
            this._showNotification('Screenshot Error', e.message);
        }
    }

    async _runOCR(imagePath) {
        try {
            const ocrHelperPath = this._getOcrHelperPath();
            const ocrLanguage = this._settings.get_string('ocr-language');
            
            if (!ocrHelperPath) {
                this._hideLoadingIndicator();
                this._isProcessing = false;
                this._showNotification('OCR Error', 'text-extractor-ocr is not installed. Re-run install.sh to install the helper and Tesseract automatically.');
                return;
            }
            
            // Create a new cancellable for this subprocess
            this._cancellable = new Gio.Cancellable();

            // Run OCR helper script
            this._subprocess = Gio.Subprocess.new(
                [ocrHelperPath, imagePath, ocrLanguage],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            this._cancellable.connect(() => this._subprocess.force_exit());
            
            const [stdout, stderr] = await new Promise((resolve, reject) => {
                this._subprocess.communicate_utf8_async(null, this._cancellable, (subprocess, result) => {
                    try {
                        const [, stdoutStr, stderrStr] = subprocess.communicate_utf8_finish(result);
                        resolve([stdoutStr, stderrStr]);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            
            // Hide loading indicator
            this._hideLoadingIndicator();

            // Clear cancellable and subprocess references
            this._cancellable = null;
            this._subprocess = null;
            
            if (stdout && stdout.trim()) {
                try {
                    // Find JSON in output
                    let jsonStr = stdout.trim();
                    const jsonStart = jsonStr.indexOf('{');
                    if (jsonStart > 0) {
                        jsonStr = jsonStr.substring(jsonStart);
                    }
                    
                    const ocrResult = JSON.parse(jsonStr);
                    
                    if (ocrResult.success) {
                        // Extract ALL text from all lines
                        const lines = ocrResult.lines || [];
                        const allText = lines.map(line => line.text).join('\n');
                        
                        if (allText.trim()) {
                            // Copy to clipboard
                            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, allText);
                            
                            // Show success notification
                            const lineCount = lines.length;
                            const charCount = allText.length;
                            this._showNotification(
                                'Text Extracted',
                                `${lineCount} line(s), ${charCount} characters copied to clipboard`
                            );
                        } else {
                            this._showNotification('No Text Found', 'No text detected in the selected area');
                        }
                    } else {
                        console.error(`[TextExtractor] OCR error: ${ocrResult.error}`);
                        this._showNotification('OCR Error', ocrResult.error || 'OCR processing failed');
                    }
                } catch (parseError) {
                    console.error(`[TextExtractor] Failed to parse OCR result: ${parseError.message}`);
                    this._showNotification('OCR Error', 'Failed to parse OCR results');
                }
            } else {
                console.error(`[TextExtractor] OCR produced no output. stderr: ${stderr}`);
                this._showNotification('OCR Error', stderr || 'OCR produced no output');
            }
            
            // Delete screenshot if save-screenshots is disabled
            this._cleanupScreenshot(imagePath);
            
            this._isProcessing = false;
            
        } catch (e) {
            this._cancellable = null;
            this._subprocess = null;
            console.error(`[TextExtractor] OCR error: ${e.message}`);
            this._hideLoadingIndicator();
            this._isProcessing = false;
            this._showNotification('OCR Error', e.message);
        }
    }
    
    _cleanupScreenshot(imagePath) {
        // Check if user wants to keep screenshots
        if (this._settings && !this._settings.get_boolean('save-screenshots')) {
            try {
                const file = Gio.File.new_for_path(imagePath);
                if (file.query_exists(null)) {
                    file.delete(null);
                }
            } catch (e) {
                console.error(`[TextExtractor] Failed to delete screenshot: ${e.message}`);
            }
        }
    }

    _showNotification(title, message) {
        // Check if notifications are enabled
        if (this._settings && this._settings.get_boolean('show-notification')) {
            Main.notify(title, message);
        }
    }
    
    _showLoadingIndicator(message) {
        this._hideLoadingIndicator();
        
        this._loadingIndicator = new St.BoxLayout({
            style: `
                background-color: rgba(0, 0, 0, 0.85);
                border-radius: 12px;
                padding: 16px 28px;
            `,
            vertical: true,
        });
        
        const label = new St.Label({
            text: message || 'Processing...',
            style: 'color: white; font-size: 14px; text-align: center;',
        });
        this._loadingIndicator.add_child(label);
        
        // Center on screen
        const monitor = Main.layoutManager.primaryMonitor;
        this._loadingIndicator.set_position(
            Math.floor(monitor.x + (monitor.width - 200) / 2),
            Math.floor(monitor.y + (monitor.height - 60) / 2)
        );
        
        Main.layoutManager.addTopChrome(this._loadingIndicator);
    }
    
    _hideLoadingIndicator() {
        if (this._loadingIndicator) {
            Main.layoutManager.removeChrome(this._loadingIndicator);
            this._loadingIndicator.destroy();
            this._loadingIndicator = null;
        }
    }

}
