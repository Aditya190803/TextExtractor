/**
 * Text Extractor - Preferences Window
 * GTK4/Adw preferences interface for extension settings
 */

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class TextExtractorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        
        // Create main page
        const page = new Adw.PreferencesPage({
            title: _('Settings'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);
        
        // === Shortcut Group ===
        const shortcutGroup = new Adw.PreferencesGroup({
            title: _('Keyboard Shortcut'),
            description: _('Configure the shortcut to trigger text extraction'),
        });
        page.add(shortcutGroup);
        
        // Shortcut row
        const shortcutRow = new Adw.ActionRow({
            title: _('Activation Shortcut'),
            subtitle: _('Press to capture text from screen'),
        });
        
        const shortcutLabel = new Gtk.ShortcutLabel({
            accelerator: settings.get_strv('shortcut')[0] || '<Super><Shift>t',
            valign: Gtk.Align.CENTER,
        });
        shortcutRow.add_suffix(shortcutLabel);
        shortcutRow.activatable = true;
        shortcutRow.connect('activated', () => {
            this._showShortcutDialog(window, settings, shortcutLabel);
        });
        shortcutGroup.add(shortcutRow);
        
        // Reset shortcut
        const resetRow = new Adw.ActionRow({
            title: _('Reset Shortcut'),
            subtitle: _('Reset to default (Super+Shift+T)'),
        });
        const resetButton = new Gtk.Button({
            label: _('Reset'),
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
        });
        resetButton.connect('clicked', () => {
            settings.set_strv('shortcut', ['<Super><Shift>t']);
            shortcutLabel.accelerator = '<Super><Shift>t';
        });
        resetRow.add_suffix(resetButton);
        shortcutGroup.add(resetRow);
        
        // === OCR Group ===
        const ocrGroup = new Adw.PreferencesGroup({
            title: _('OCR Settings'),
            description: _('Configure text recognition'),
        });
        page.add(ocrGroup);
        
        // Language selection
        const languageRow = new Adw.ComboRow({
            title: _('Recognition Language'),
            subtitle: _('Language for OCR text recognition'),
        });
        
        const languages = new Gtk.StringList();
        const langCodes = [
            ['eng', 'English'],
            ['deu', 'German'],
            ['fra', 'French'],
            ['spa', 'Spanish'],
            ['ita', 'Italian'],
            ['por', 'Portuguese'],
            ['nld', 'Dutch'],
            ['rus', 'Russian'],
            ['jpn', 'Japanese'],
            ['chi_sim', 'Chinese (Simplified)'],
            ['chi_tra', 'Chinese (Traditional)'],
            ['kor', 'Korean'],
            ['ara', 'Arabic'],
            ['hin', 'Hindi'],
        ];
        
        langCodes.forEach(([code, name]) => {
            languages.append(`${name} (${code})`);
        });
        languageRow.model = languages;
        
        // Set current selection
        const currentLang = settings.get_string('ocr-language');
        const langIndex = langCodes.findIndex(([code]) => code === currentLang);
        languageRow.selected = langIndex >= 0 ? langIndex : 0;
        
        languageRow.connect('notify::selected', () => {
            const selected = languageRow.selected;
            if (selected >= 0 && selected < langCodes.length) {
                settings.set_string('ocr-language', langCodes[selected][0]);
            }
        });
        ocrGroup.add(languageRow);
        
        // Custom language code
        const customLangRow = new Adw.EntryRow({
            title: _('Custom Language Code'),
            text: settings.get_string('ocr-language'),
        });
        customLangRow.connect('changed', () => {
            const text = customLangRow.text.trim();
            if (text) {
                settings.set_string('ocr-language', text);
            }
        });
        ocrGroup.add(customLangRow);
        
        // === Notifications Group ===
        const notifyGroup = new Adw.PreferencesGroup({
            title: _('Notifications'),
        });
        page.add(notifyGroup);
        
        const notifyRow = new Adw.SwitchRow({
            title: _('Show Notifications'),
            subtitle: _('Display notification after text extraction'),
        });
        settings.bind('show-notification', notifyRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        notifyGroup.add(notifyRow);
        
        // === Storage Group ===
        const storageGroup = new Adw.PreferencesGroup({
            title: _('Screenshot Storage'),
        });
        page.add(storageGroup);
        
        const saveRow = new Adw.SwitchRow({
            title: _('Save Screenshots'),
            subtitle: _('Keep screenshots in ~/Pictures/Screenshots/TextExtractor/\nIf disabled, deleted immediately after OCR'),
        });
        settings.bind('save-screenshots', saveRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        storageGroup.add(saveRow);
        
        // === About Group ===
        const aboutGroup = new Adw.PreferencesGroup({
            title: _('About'),
        });
        page.add(aboutGroup);
        
        const aboutRow = new Adw.ActionRow({
            title: _('Text Extractor'),
            subtitle: _('Extract text from screen using OCR\nScreenshots saved to ~/Pictures/Screenshots/TextExtractor/'),
        });
        aboutGroup.add(aboutRow);
        
        const versionRow = new Adw.ActionRow({
            title: _('Version'),
            subtitle: '1.0',
        });
        aboutGroup.add(versionRow);
    }

    _showShortcutDialog(parent, settings, shortcutLabel) {
        const dialog = new Gtk.Dialog({
            title: _('Set Keyboard Shortcut'),
            transient_for: parent,
            modal: true,
            use_header_bar: true,
        });
        
        dialog.set_default_size(300, 100);
        
        const contentArea = dialog.get_content_area();
        contentArea.margin_top = 20;
        contentArea.margin_bottom = 20;
        contentArea.margin_start = 20;
        contentArea.margin_end = 20;
        
        const label = new Gtk.Label({
            label: _('Press a key combination\nor ESC to cancel'),
            justify: Gtk.Justification.CENTER,
        });
        contentArea.append(label);
        
        const controller = new Gtk.EventControllerKey();
        controller.connect('key-pressed', (ctrl, keyval, keycode, state) => {
            // Ignore modifier-only presses
            if ([
                Gdk.KEY_Shift_L, Gdk.KEY_Shift_R,
                Gdk.KEY_Control_L, Gdk.KEY_Control_R,
                Gdk.KEY_Alt_L, Gdk.KEY_Alt_R,
                Gdk.KEY_Super_L, Gdk.KEY_Super_R,
                Gdk.KEY_Meta_L, Gdk.KEY_Meta_R,
            ].includes(keyval)) {
                return false;
            }
            
            // ESC to cancel
            if (keyval === Gdk.KEY_Escape && state === 0) {
                dialog.close();
                return true;
            }
            
            // Build accelerator
            const mask = state & Gtk.accelerator_get_default_mod_mask();
            const accel = Gtk.accelerator_name(keyval, mask);
            
            if (accel) {
                settings.set_strv('shortcut', [accel]);
                shortcutLabel.accelerator = accel;
            }
            
            dialog.close();
            return true;
        });
        
        dialog.add_controller(controller);
        dialog.present();
    }
}
