/**
 * Text Extractor - Utility Functions
 * Helper utilities for error handling and common operations
 */

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

/**
 * Check if Tesseract is installed
 * @returns {boolean}
 */
export function isTesseractInstalled() {
    try {
        const [success] = GLib.spawn_command_line_sync('which tesseract');
        return success;
    } catch (e) {
        return false;
    }
}

/**
 * Get installed Tesseract languages
 * @returns {string[]}
 */
export function getTesseractLanguages() {
    try {
        const [success, stdout] = GLib.spawn_command_line_sync('tesseract --list-langs');
        if (success && stdout) {
            const output = new TextDecoder().decode(stdout);
            const lines = output.split('\n');
            // First line is header, skip it
            return lines.slice(1).filter(lang => lang.trim().length > 0);
        }
    } catch (e) {
        console.error(`[TextExtractor] Failed to get Tesseract languages: ${e.message}`);
    }
    return ['eng'];
}

/**
 * Check if Python3 is installed
 * @returns {boolean}
 */
export function isPython3Installed() {
    try {
        const [success] = GLib.spawn_command_line_sync('which python3');
        return success;
    } catch (e) {
        return false;
    }
}

/**
 * Check if required Python modules are installed
 * @returns {{pytesseract: boolean, pillow: boolean}}
 */
export function checkPythonModules() {
    const result = { pytesseract: false, pillow: false };
    
    try {
        const [success1] = GLib.spawn_command_line_sync("python3 -c 'import pytesseract'");
        result.pytesseract = success1;
    } catch (e) {
        result.pytesseract = false;
    }
    
    try {
        const [success2] = GLib.spawn_command_line_sync("python3 -c 'from PIL import Image'");
        result.pillow = success2;
    } catch (e) {
        result.pillow = false;
    }
    
    return result;
}

/**
 * Get all dependency status
 * @returns {{tesseract: boolean, python3: boolean, pytesseract: boolean, pillow: boolean}}
 */
export function checkAllDependencies() {
    const pythonModules = checkPythonModules();
    return {
        tesseract: isTesseractInstalled(),
        python3: isPython3Installed(),
        ...pythonModules,
    };
}

/**
 * Get user-friendly error message for missing dependencies
 * @param {object} deps - Dependency status object
 * @returns {string|null}
 */
export function getDependencyErrorMessage(deps) {
    const missing = [];
    
    if (!deps.tesseract) {
        missing.push('Tesseract OCR');
    }
    if (!deps.python3) {
        missing.push('Python 3');
    }
    if (!deps.pytesseract) {
        missing.push('pytesseract Python module');
    }
    if (!deps.pillow) {
        missing.push('Pillow Python module');
    }
    
    if (missing.length === 0) {
        return null;
    }
    
    return `Missing dependencies: ${missing.join(', ')}. Please check the README for installation instructions.`;
}

/**
 * Show notification
 * @param {string} title
 * @param {string} message
 */
export function notify(title, message) {
    Main.notify(title, message);
}

/**
 * Show error notification
 * @param {string} message
 */
export function notifyError(message) {
    notify('Text Extractor Error', message);
}

/**
 * Create a temporary file
 * @param {string} prefix
 * @param {string} suffix
 * @returns {string} - Path to temp file
 */
export function createTempFile(prefix = 'textextractor', suffix = '.png') {
    const tempDir = GLib.get_tmp_dir();
    const timestamp = GLib.DateTime.new_now_local().format('%Y%m%d_%H%M%S_%f');
    const filename = `${prefix}_${timestamp}${suffix}`;
    return GLib.build_filenamev([tempDir, filename]);
}

/**
 * Delete a file safely
 * @param {string} filepath
 * @returns {boolean}
 */
export function deleteFile(filepath) {
    try {
        const file = Gio.File.new_for_path(filepath);
        if (file.query_exists(null)) {
            file.delete(null);
            return true;
        }
    } catch (e) {
        console.error(`[TextExtractor] Failed to delete file ${filepath}: ${e.message}`);
    }
    return false;
}

/**
 * Check if file exists
 * @param {string} filepath
 * @returns {boolean}
 */
export function fileExists(filepath) {
    return GLib.file_test(filepath, GLib.FileTest.EXISTS);
}

/**
 * Read file contents
 * @param {string} filepath
 * @returns {string|null}
 */
export function readFile(filepath) {
    try {
        const file = Gio.File.new_for_path(filepath);
        const [success, contents] = file.load_contents(null);
        if (success) {
            return new TextDecoder().decode(contents);
        }
    } catch (e) {
        console.error(`[TextExtractor] Failed to read file ${filepath}: ${e.message}`);
    }
    return null;
}

/**
 * Write file contents
 * @param {string} filepath
 * @param {string} contents
 * @returns {boolean}
 */
export function writeFile(filepath, contents) {
    try {
        const file = Gio.File.new_for_path(filepath);
        const outputStream = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
        outputStream.write_all(contents, null);
        outputStream.close(null);
        return true;
    } catch (e) {
        console.error(`[TextExtractor] Failed to write file ${filepath}: ${e.message}`);
    }
    return false;
}

/**
 * Parse hex color to RGB
 * @param {string} hex
 * @returns {{r: number, g: number, b: number}}
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : { r: 53, g: 132, b: 228 };
}

/**
 * Convert RGB to hex color
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string}
 */
export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
