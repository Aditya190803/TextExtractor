/**
 * Text Extractor - Preferences Window
 * GTK4 preferences interface for extension settings
 */

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class TextExtractorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        
        // Create pages
        const generalPage = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(generalPage);
        
        const ocrPage = new Adw.PreferencesPage({
            title: _('OCR'),
            icon_name: 'document-edit-symbolic',
        });
        window.add(ocrPage);
        
        const uiPage = new Adw.PreferencesPage({
            title: _('Appearance'),
            icon_name: 'applications-graphics-symbolic',
        });
        window.add(uiPage);
        
        // === General Page ===
        this._buildGeneralPage(generalPage, settings);
        
        // === OCR Page ===
        this._buildOCRPage(ocrPage, settings);
        
        // === Appearance Page ===
        this._buildAppearancePage(uiPage, settings);
    }

    _buildGeneralPage(page, settings) {
        // Shortcut Group
        const shortcutGroup = new Adw.PreferencesGroup({
            title: _('Keyboard Shortcut'),
            description: _('Configure the shortcut to trigger text extraction'),
        });
        page.add(shortcutGroup);
        
        // Shortcut row
        const shortcutRow = new Adw.ActionRow({
            title: _('Activation Shortcut'),
            subtitle: _('Click to set a new shortcut'),
        });
        
        const shortcutLabel = new Gtk.ShortcutLabel({
            accelerator: settings.get_strv('shortcut')[0] || '',
            valign: Gtk.Align.CENTER,
        });
        shortcutRow.add_suffix(shortcutLabel);
        
        // Make row clickable to change shortcut
        shortcutRow.activatable = true;
        shortcutRow.connect('activated', () => {
            this._showShortcutDialog(settings, shortcutLabel);
        });
        
        shortcutGroup.add(shortcutRow);
        
        // Reset shortcut button
        const resetShortcutRow = new Adw.ActionRow({
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
        resetShortcutRow.add_suffix(resetButton);
        shortcutGroup.add(resetShortcutRow);
        
        // Directory Group
        const directoryGroup = new Adw.PreferencesGroup({
            title: _('File Settings'),
            description: _('Configure screenshot and file save locations'),
        });
        page.add(directoryGroup);
        
        // Screenshot directory
        const directoryRow = new Adw.ActionRow({
            title: _('Screenshot Directory'),
            subtitle: settings.get_string('screenshot-directory') || _('Using system default'),
        });
        
        const directoryButton = new Gtk.Button({
            label: _('Choose...'),
            valign: Gtk.Align.CENTER,
        });
        directoryButton.connect('clicked', () => {
            this._showDirectoryChooser(settings, directoryRow);
        });
        directoryRow.add_suffix(directoryButton);
        
        const clearDirButton = new Gtk.Button({
            icon_name: 'edit-clear-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
            tooltip_text: _('Reset to default'),
        });
        clearDirButton.connect('clicked', () => {
            settings.set_string('screenshot-directory', '');
            directoryRow.subtitle = _('Using system default');
        });
        directoryRow.add_suffix(clearDirButton);
        
        directoryGroup.add(directoryRow);
        
        // Notifications Group
        const notifyGroup = new Adw.PreferencesGroup({
            title: _('Notifications'),
        });
        page.add(notifyGroup);
        
        // Show confirmation
        const confirmRow = new Adw.SwitchRow({
            title: _('Show Confirmation'),
            subtitle: _('Show notification after copying text'),
        });
        settings.bind('show-confirmation', confirmRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        notifyGroup.add(confirmRow);
    }

    _buildOCRPage(page, settings) {
        // Language Group
        const languageGroup = new Adw.PreferencesGroup({
            title: _('OCR Language'),
            description: _('Configure Tesseract OCR language settings'),
        });
        page.add(languageGroup);
        
        // OCR Language
        const languageRow = new Adw.ComboRow({
            title: _('Recognition Language'),
            subtitle: _('Language for text recognition'),
        });
        
        // Common languages list
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
            ['pol', 'Polish'],
            ['tur', 'Turkish'],
            ['vie', 'Vietnamese'],
            ['tha', 'Thai'],
        ];
        
        langCodes.forEach(([code, name]) => {
            languages.append(`${name} (${code})`);
        });
        
        languageRow.model = languages;
        
        // Set current value
        const currentLang = settings.get_string('ocr-language');
        const langIndex = langCodes.findIndex(([code]) => code === currentLang);
        if (langIndex >= 0) {
            languageRow.selected = langIndex;
        }
        
        languageRow.connect('notify::selected', () => {
            const selected = languageRow.selected;
            if (selected >= 0 && selected < langCodes.length) {
                settings.set_string('ocr-language', langCodes[selected][0]);
            }
        });
        
        languageGroup.add(languageRow);
        
        // Custom language entry
        const customLangRow = new Adw.EntryRow({
            title: _('Custom Language Code'),
            text: settings.get_string('ocr-language'),
        });
        customLangRow.connect('changed', () => {
            settings.set_string('ocr-language', customLangRow.text);
        });
        languageGroup.add(customLangRow);
        
        // Behavior Group
        const behaviorGroup = new Adw.PreferencesGroup({
            title: _('Behavior'),
        });
        page.add(behaviorGroup);
        
        // Default mode
        const modeRow = new Adw.ComboRow({
            title: _('Default Selection Mode'),
            subtitle: _('How text regions are initially handled'),
        });
        
        const modes = new Gtk.StringList();
        modes.append(_('Manual Selection'));
        modes.append(_('Select All'));
        modeRow.model = modes;
        
        const currentMode = settings.get_string('default-mode');
        modeRow.selected = currentMode === 'all' ? 1 : 0;
        
        modeRow.connect('notify::selected', () => {
            settings.set_string('default-mode', modeRow.selected === 1 ? 'all' : 'selection');
        });
        
        behaviorGroup.add(modeRow);
        
        // Auto copy
        const autoCopyRow = new Adw.SwitchRow({
            title: _('Auto Copy'),
            subtitle: _('Automatically close overlay after copying'),
        });
        settings.bind('auto-copy', autoCopyRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(autoCopyRow);
    }

    _buildAppearancePage(page, settings) {
        // Overlay Group
        const overlayGroup = new Adw.PreferencesGroup({
            title: _('Overlay'),
            description: _('Configure the text extraction overlay appearance'),
        });
        page.add(overlayGroup);
        
        // Overlay opacity
        const opacityRow = new Adw.ActionRow({
            title: _('Background Opacity'),
            subtitle: _('Opacity of the overlay background'),
        });
        
        const opacityScale = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            adjustment: new Gtk.Adjustment({
                lower: 0.1,
                upper: 1.0,
                step_increment: 0.05,
                value: settings.get_double('overlay-opacity'),
            }),
            digits: 2,
            draw_value: true,
            value_pos: Gtk.PositionType.LEFT,
            hexpand: true,
            width_request: 200,
        });
        
        opacityScale.connect('value-changed', () => {
            settings.set_double('overlay-opacity', opacityScale.adjustment.value);
        });
        
        opacityRow.add_suffix(opacityScale);
        overlayGroup.add(opacityRow);
        
        // Highlight color
        const colorRow = new Adw.ActionRow({
            title: _('Highlight Color'),
            subtitle: _('Color for text region borders'),
        });
        
        const colorButton = new Gtk.ColorButton({
            valign: Gtk.Align.CENTER,
            use_alpha: false,
        });
        
        // Parse current color
        const currentColor = settings.get_string('highlight-color');
        const rgba = new Gdk.RGBA();
        rgba.parse(currentColor);
        colorButton.set_rgba(rgba);
        
        colorButton.connect('color-set', () => {
            const newColor = colorButton.get_rgba();
            const hexColor = '#%02x%02x%02x'.format(
                Math.round(newColor.red * 255),
                Math.round(newColor.green * 255),
                Math.round(newColor.blue * 255)
            );
            settings.set_string('highlight-color', hexColor);
        });
        
        colorRow.add_suffix(colorButton);
        overlayGroup.add(colorRow);
        
        // Text Group
        const textGroup = new Adw.PreferencesGroup({
            title: _('Text Panel'),
        });
        page.add(textGroup);
        
        // Font size
        const fontRow = new Adw.SpinRow({
            title: _('Font Size'),
            subtitle: _('Text size in the preview panel'),
            adjustment: new Gtk.Adjustment({
                lower: 8,
                upper: 24,
                step_increment: 1,
                value: settings.get_int('font-size'),
            }),
        });
        
        settings.bind('font-size', fontRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        textGroup.add(fontRow);
    }

    _showShortcutDialog(settings, shortcutLabel) {
        const dialog = new Gtk.Dialog({
            title: _('Set Keyboard Shortcut'),
            modal: true,
            use_header_bar: true,
        });
        
        const contentArea = dialog.get_content_area();
        contentArea.margin_top = 20;
        contentArea.margin_bottom = 20;
        contentArea.margin_start = 20;
        contentArea.margin_end = 20;
        
        const label = new Gtk.Label({
            label: _('Press a key combination or ESC to cancel'),
            margin_bottom: 20,
        });
        contentArea.append(label);
        
        const controller = new Gtk.EventControllerKey();
        controller.connect('key-pressed', (ctrl, keyval, keycode, state) => {
            // Filter out modifiers only
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
            
            // Build accelerator string
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

    _showDirectoryChooser(settings, row) {
        // Note: Native file chooser dialogs work differently in GTK4
        // For simplicity, using a basic approach
        const dialog = new Gtk.FileChooserDialog({
            title: _('Choose Screenshot Directory'),
            action: Gtk.FileChooserAction.SELECT_FOLDER,
        });
        
        dialog.add_button(_('Cancel'), Gtk.ResponseType.CANCEL);
        dialog.add_button(_('Select'), Gtk.ResponseType.ACCEPT);
        
        const currentDir = settings.get_string('screenshot-directory');
        if (currentDir) {
            const file = Gio.File.new_for_path(currentDir);
            dialog.set_current_folder(file);
        }
        
        dialog.connect('response', (dlg, response) => {
            if (response === Gtk.ResponseType.ACCEPT) {
                const folder = dialog.get_file();
                if (folder) {
                    const path = folder.get_path();
                    settings.set_string('screenshot-directory', path);
                    row.subtitle = path;
                }
            }
            dialog.destroy();
        });
        
        dialog.present();
    }
}
