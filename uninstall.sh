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

echo ""
echo "Uninstallation complete!"
echo "Please restart GNOME Shell to complete the removal."
