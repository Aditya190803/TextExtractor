#!/bin/bash

# Uninstall script for Text Extractor GNOME Extension

EXTENSION_UUID="text-extractor@aditya190803"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "Uninstalling Text Extractor Extension..."

# Disable extension first
gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null

# Remove extension directory
if [ -d "$EXTENSION_DIR" ]; then
    rm -rf "$EXTENSION_DIR"
    echo "Extension removed from $EXTENSION_DIR"
else
    echo "Extension directory not found at $EXTENSION_DIR"
fi

# Remove OCR helper script
BIN_DIR="$HOME/.local/bin"
OCR_HELPER="$BIN_DIR/text-extractor-ocr"
if [ -f "$OCR_HELPER" ]; then
    rm "$OCR_HELPER"
    echo "OCR helper script removed from $BIN_DIR"
fi

SYSTEM_OCR_HELPER="/usr/local/bin/text-extractor-ocr"
if [ -f "$SYSTEM_OCR_HELPER" ]; then
    if [ "$EUID" -eq 0 ]; then
        rm "$SYSTEM_OCR_HELPER"
        echo "System OCR launcher removed from /usr/local/bin"
    elif command -v sudo >/dev/null 2>&1; then
        sudo rm "$SYSTEM_OCR_HELPER"
        echo "System OCR launcher removed from /usr/local/bin"
    else
        echo "System OCR launcher still exists at $SYSTEM_OCR_HELPER. Remove it manually if desired."
    fi
fi

echo ""
echo "Uninstallation complete!"
echo "Please restart GNOME Shell to complete the removal."
