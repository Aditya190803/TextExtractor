#!/bin/bash

set -e

EXTENSION_UUID="text-extractor@aditya190803"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================"
echo "Text Extractor GNOME Extension Installer"
echo "============================================"
echo ""

echo "Checking dependencies..."

MISSING_DEPS=()

if ! command -v python3 &> /dev/null; then
    MISSING_DEPS+=("python3")
fi

if ! command -v tesseract &> /dev/null; then
    MISSING_DEPS+=("tesseract")
fi

if ! command -v gnome-screenshot &> /dev/null; then
    MISSING_DEPS+=("gnome-screenshot")
fi

if ! python3 -c "import PIL" &> /dev/null; then
    MISSING_DEPS+=("python-pillow")
fi

if ! python3 -c "import pytesseract" &> /dev/null; then
    MISSING_DEPS+=("python-pytesseract")
fi

if ! python3 -c "import pyperclip" &> /dev/null; then
    MISSING_DEPS+=("python-pyperclip")
fi

if ! python3 -c "import gi; gi.require_version('Gtk', '4.0')" &> /dev/null; then
    MISSING_DEPS+=("python-gobject gtk4")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo ""
    echo "ERROR: Missing dependencies: ${MISSING_DEPS[*]}"
    echo ""
    echo "On Arch Linux, install with:"
    echo "  sudo pacman -S python-pillow python-pytesseract tesseract python-pyperclip python-gobject gtk4 gnome-screenshot"
    echo ""
    echo "For Tesseract language data (English is included by default):"
    echo "  sudo pacman -S tesseract-data-eng"
    echo ""
    exit 1
fi

echo "✓ All dependencies found"
echo ""

echo "Installing extension to: $INSTALL_DIR"

mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/schemas"

cp -r "$SCRIPT_DIR/extension/"* "$INSTALL_DIR/"

mkdir -p "$HOME/.local/share/gnome-shell/extensions/helper"
cp "$SCRIPT_DIR/helper/text-extractor-helper.py" "$HOME/.local/share/gnome-shell/extensions/helper/"
chmod +x "$HOME/.local/share/gnome-shell/extensions/helper/text-extractor-helper.py"

echo "Compiling GSettings schemas..."
glib-compile-schemas "$INSTALL_DIR/schemas/"

echo ""
echo "============================================"
echo "Installation complete!"
echo "============================================"
echo ""
echo "To enable the extension:"
echo "  1. Restart GNOME Shell:"
echo "     - On X11: Press Alt+F2, type 'r', press Enter"
echo "     - On Wayland: Log out and log back in"
echo ""
echo "  2. Enable the extension:"
echo "     gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "  3. Use Super+Shift+T to extract text from screen"
echo ""
echo "To configure the keyboard shortcut:"
echo "  - Open GNOME Settings > Keyboard > View and Customize Shortcuts"
echo "  - Search for 'Text Extractor'"
echo ""
