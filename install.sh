#!/bin/bash

# Install & Build script for Text Extractor GNOME Extension

EXTENSION_UUID="text-extractor@aditya190803"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
SOURCE_DIR="text-extractor@aditya190803"
BUILD_DIR="build"

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

# Compile GSettings schema
echo "Compiling GSettings schema..."
if [ -d "$SOURCE_DIR/schemas" ]; then
    glib-compile-schemas "$SOURCE_DIR/schemas/"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to compile GSettings schema"
        exit 1
    fi
fi

# Create build directory and zip package (optional, for distribution)
echo "Creating distribution package..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cp -r "$SOURCE_DIR"/* "$BUILD_DIR/"
chmod +x "$BUILD_DIR/ocr_helper.py"

if command -v zip &> /dev/null; then
    cd "$BUILD_DIR"
    zip -r "../$EXTENSION_UUID.zip" ./*
    cd ..
    echo "Package created: $EXTENSION_UUID.zip"
else
    echo "WARNING: 'zip' command not found. Skipping package creation."
fi

# --- Install Step ---
echo "Installing extension to $EXTENSION_DIR..."
mkdir -p "$EXTENSION_DIR"

# Copy files
cp -r "$SOURCE_DIR"/* "$EXTENSION_DIR/"

# Make OCR helper executable
chmod +x "$EXTENSION_DIR/ocr_helper.py"

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
