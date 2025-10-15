#!/usr/bin/env python3

import os
import sys
import tempfile
import subprocess
import argparse
import gi

gi.require_version('Gtk', '4.0')
gi.require_version('Gdk', '4.0')

from gi.repository import Gtk, Gdk, GLib
from PIL import Image
import pytesseract
import pyperclip


class TextExtractorApp:
    def __init__(self, language='eng'):
        self.language = language
        self.temp_screenshot = None
        self.extracted_text = ""

    def capture_screenshot(self):
        try:
            fd, self.temp_screenshot = tempfile.mkstemp(suffix='.png', prefix='text-extractor-')
            os.close(fd)

            result = subprocess.run(
                ['gnome-screenshot', '-a', '-f', self.temp_screenshot],
                capture_output=True,
                timeout=30
            )

            if result.returncode != 0 or not os.path.exists(self.temp_screenshot):
                return False

            if os.path.getsize(self.temp_screenshot) == 0:
                return False

            return True

        except subprocess.TimeoutExpired:
            self._show_error_dialog("Screenshot timeout", "Screenshot capture took too long")
            return False
        except Exception as e:
            self._show_error_dialog("Screenshot failed", str(e))
            return False

    def perform_ocr(self):
        try:
            image = Image.open(self.temp_screenshot)
            self.extracted_text = pytesseract.image_to_string(
                image,
                lang=self.language,
                config='--psm 6'
            )

            if not self.extracted_text.strip():
                self._show_error_dialog(
                    "No text found",
                    "Could not extract any text from the selected area"
                )
                return False

            return True

        except Exception as e:
            self._show_error_dialog("OCR failed", str(e))
            return False

    def show_text_selection_gui(self):
        app = Gtk.Application(application_id='com.aditya190803.textextractor')
        app.connect('activate', self._on_activate)
        app.run(None)

    def _on_activate(self, app):
        window = Gtk.ApplicationWindow(application=app)
        window.set_title("Text Extractor")
        window.set_default_size(600, 400)

        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        box.set_margin_top(10)
        box.set_margin_bottom(10)
        box.set_margin_start(10)
        box.set_margin_end(10)

        label = Gtk.Label(label="Extracted Text (select text to copy or copy all):")
        label.set_halign(Gtk.Align.START)
        box.append(label)

        scrolled_window = Gtk.ScrolledWindow()
        scrolled_window.set_vexpand(True)
        scrolled_window.set_hexpand(True)

        text_view = Gtk.TextView()
        text_view.set_editable(True)
        text_view.set_wrap_mode(Gtk.WrapMode.WORD_CHAR)
        text_buffer = text_view.get_buffer()
        text_buffer.set_text(self.extracted_text)

        scrolled_window.set_child(text_view)
        box.append(scrolled_window)

        button_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        button_box.set_halign(Gtk.Align.END)

        copy_button = Gtk.Button(label="Copy Selected Text")
        copy_button.connect('clicked', self._on_copy_clicked, text_buffer, window)
        button_box.append(copy_button)

        close_button = Gtk.Button(label="Close")
        close_button.connect('clicked', lambda btn: window.close())
        button_box.append(close_button)

        box.append(button_box)

        window.set_child(box)
        window.present()

    def _on_copy_clicked(self, button, text_buffer, window):
        bounds = text_buffer.get_selection_bounds()

        if bounds:
            text_to_copy = text_buffer.get_text(bounds[0], bounds[1], True)
        else:
            start = text_buffer.get_start_iter()
            end = text_buffer.get_end_iter()
            text_to_copy = text_buffer.get_text(start, end, True)

        if text_to_copy:
            pyperclip.copy(text_to_copy)
            window.close()

    def _show_error_dialog(self, title, message):
        app = Gtk.Application(application_id='com.aditya190803.textextractor.error')

        def on_activate(app):
            dialog = Gtk.AlertDialog()
            dialog.set_message(title)
            dialog.set_detail(message)
            dialog.set_buttons(["OK"])

            window = Gtk.ApplicationWindow(application=app)
            dialog.choose(window, None, lambda dialog, result: app.quit())
            window.present()

        app.connect('activate', on_activate)
        app.run(None)

    def cleanup(self):
        if self.temp_screenshot and os.path.exists(self.temp_screenshot):
            try:
                os.remove(self.temp_screenshot)
            except:
                pass

    def run(self):
        try:
            if not self.capture_screenshot():
                return 1

            if not self.perform_ocr():
                return 1

            self.show_text_selection_gui()
            return 0

        finally:
            self.cleanup()


def main():
    parser = argparse.ArgumentParser(description='Text Extractor Helper')
    parser.add_argument('--language', '-l', default='eng',
                        help='Tesseract OCR language code (default: eng)')

    args = parser.parse_args()

    app = TextExtractorApp(language=args.language)
    sys.exit(app.run())


if __name__ == '__main__':
    main()
