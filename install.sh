#!/bin/bash

# Install & Build script for Text Extractor GNOME Extension

EXTENSION_UUID="text-extractor@aditya190803"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
SOURCE_DIR="build"

echo "Installing Text Extractor Extension..."

# Check for required dependencies
echo "Checking dependencies..."

# Check for Tesseract
if ! command -v tesseract &> /dev/null; then
    echo "WARNING: Tesseract OCR is not installed."
    echo "Please install it using:"
    echo "  Ubuntu/Debian: sudo apt install tesseract-ocr tesseract-ocr-eng"
    echo "  Fedora: sudo dnf install tesseract tesseract-langpack-eng"
    echo "  Arch: sudo pacman -S tesseract tesseract-data-eng"
    echo ""
fi

# Check for Python3 and required modules
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is required but not installed."
    exit 1
fi

# Check for pytesseract
python3 -c "import pytesseract" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "WARNING: pytesseract Python module is not installed."
    echo "Please install it using: pip3 install pytesseract Pillow"
    echo ""
fi

# Check for PIL/Pillow
python3 -c "from PIL import Image" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "WARNING: Pillow Python module is not installed."
    echo "Please install it using: pip3 install Pillow"
    echo ""
fi

# --- Build Step ---
echo "Building extension..."

# Create distribution package (optional, for distribution)
echo "Creating distribution package..."
if [ -d "$SOURCE_DIR" ]; then
    if command -v zip &> /dev/null; then
        (cd "$SOURCE_DIR" && zip -r "../$EXTENSION_UUID.zip" .)
        echo "Package created: $EXTENSION_UUID.zip"
    else
        echo "WARNING: 'zip' command not found. Skipping package creation."
    fi
else
    echo "Error: Source directory '$SOURCE_DIR' not found."
    exit 1
fi

# --- Install Step ---
echo "Installing extension to $EXTENSION_DIR..."
mkdir -p "$EXTENSION_DIR"

# Copy extension files (excluding ocr_helper.py)
for file in "$SOURCE_DIR"/*; do
    basename_file=$(basename "$file")
    if [ "$basename_file" != "ocr_helper.py" ]; then
        cp -r "$file" "$EXTENSION_DIR/"
    fi
done

# Install OCR helper as system-wide script
echo "Installing OCR helper script..."
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"
cp "$SOURCE_DIR/ocr_helper.py" "$BIN_DIR/text-extractor-ocr"
chmod +x "$BIN_DIR/text-extractor-ocr"

# Check if ~/.local/bin is in PATH
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo ""
    echo "WARNING: $BIN_DIR is not in your PATH."
    echo "Add it by running:"
    echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
    echo "  source ~/.bashrc"
    echo ""
fi

# Compile schemas in the installation directory
if [ -d "$EXTENSION_DIR/schemas" ]; then
    glib-compile-schemas "$EXTENSION_DIR/schemas/"
fi

echo ""
echo "Installation complete!"
echo ""
echo "To enable the extension:"
echo "  1. Restart GNOME Shell (Alt+F2, type 'r', press Enter) - X11 only"
echo "     Or log out and log back in (Wayland)"
echo "  2. Enable using: gnome-extensions enable $EXTENSION_UUID"
echo "     Or use GNOME Extensions app"
echo ""
echo "Default shortcut: Super+Shift+T"
