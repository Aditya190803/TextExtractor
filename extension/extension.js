import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export default class TextExtractorExtension {
    constructor() {
        this._settings = null;
        this._signalId = null;
    }

    enable() {
        this._settings = this.getSettings();

        Main.wm.addKeybinding(
            'text-extractor-shortcut',
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL,
            this._launchTextExtractor.bind(this)
        );

        log('Text Extractor extension enabled');
    }

    disable() {
        if (this._settings) {
            Main.wm.removeKeybinding('text-extractor-shortcut');
        }

        this._settings = null;
        log('Text Extractor extension disabled');
    }

    _launchTextExtractor() {
        try {
            const extensionPath = this.path || this.dir?.get_path();
            if (!extensionPath) {
                this._showError('Extension path not found');
                return;
            }

            const helperPath = GLib.build_filenamev([
                extensionPath,
                '..',
                'helper',
                'text-extractor-helper.py'
            ]);

            const ocrLanguage = this._settings.get_string('ocr-language');

            const [success, pid] = GLib.spawn_async(
                null,
                ['python3', helperPath, '--language', ocrLanguage],
                null,
                GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                null
            );

            if (success) {
                GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, (pid, status) => {
                    GLib.spawn_close_pid(pid);
                    if (status !== 0) {
                        log(`Text Extractor helper exited with status: ${status}`);
                    }
                });
            }
        } catch (e) {
            this._showError(`Failed to launch text extractor: ${e.message}`);
            logError(e);
        }
    }

    _showError(message) {
        Main.notify('Text Extractor Error', message);
    }
}
