#!/bin/bash

# Install & Build script for Text Extractor GNOME Extension

EXTENSION_UUID="text-extractor@aditya190803"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
SOURCE_DIR="build"

echo "Installing Text Extractor Extension..."

# --- Dependency install (system + Python) ---

PKG_MANAGER=""
SUDO_CMD=""

detect_pkg_manager() {
    if command -v apt-get >/dev/null 2>&1; then
        PKG_MANAGER="apt"
    elif command -v dnf >/dev/null 2>&1; then
        PKG_MANAGER="dnf"
    elif command -v pacman >/dev/null 2>&1; then
        PKG_MANAGER="pacman"
    else
        PKG_MANAGER=""
    fi
}

prepare_sudo() {
    if [ "$EUID" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
        SUDO_CMD="sudo"
    fi
}

install_system_deps() {
    case "$PKG_MANAGER" in
        apt)
            $SUDO_CMD apt-get update -y && \
            $SUDO_CMD apt-get install -y tesseract-ocr tesseract-ocr-eng python3 python3-pip zip ;;
        dnf)
            $SUDO_CMD dnf install -y tesseract tesseract-langpack-eng python3 python3-pip zip ;;
        pacman)
            $SUDO_CMD pacman -Sy --noconfirm tesseract tesseract-data-eng python python-pip zip ;;
        *)
            echo "WARNING: No supported package manager detected. Install Tesseract, python3, python3-pip, and zip manually.";
            return 1 ;;
    esac
}

ensure_python_module() {
    local module_name="$1"
    local pip_name="$2"
    python3 - <<EOF 2>/dev/null
import $module_name
EOF
    if [ $? -ne 0 ]; then
        if command -v pip3 >/dev/null 2>&1; then
            echo "Installing Python module $pip_name (user scope)..."
            pip3 install --user "$pip_name"
        else
            echo "ERROR: pip3 not found. Please install python3-pip."
            return 1
        fi
    fi
}

echo "Checking and installing dependencies..."
detect_pkg_manager
prepare_sudo
install_system_deps || true

if ! command -v python3 >/dev/null 2>&1; then
    echo "ERROR: Python3 is required but not installed."
    exit 1
fi

ensure_python_module "pytesseract" "pytesseract"
ensure_python_module "PIL" "Pillow"

if ! command -v tesseract >/dev/null 2>&1; then
    echo "WARNING: Tesseract OCR binary not found after install. Please install it manually."
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

# Ensure ~/.local/bin is available in PATH for current session and future shells
PATH_UPDATED=0
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    export PATH="$BIN_DIR:$PATH"
    PATH_UPDATED=1
fi

# Persist PATH updates for common shells
PATH_SNIPPET='export PATH="$HOME/.local/bin:$PATH"'
UPDATED_FILES=()
for rc_file in "$HOME/.profile" "$HOME/.bashrc" "$HOME/.zshrc"; do
    if [ -f "$rc_file" ]; then
        if ! grep -Fxq "$PATH_SNIPPET" "$rc_file"; then
            echo "$PATH_SNIPPET" >> "$rc_file"
            UPDATED_FILES+=("$(basename "$rc_file")")
        fi
    else
        echo "$PATH_SNIPPET" >> "$rc_file"
        UPDATED_FILES+=("$(basename "$rc_file")")
    fi
done

if [[ $PATH_UPDATED -eq 1 ]]; then
    echo "Added $BIN_DIR to PATH for this session."
fi

if [[ ${#UPDATED_FILES[@]} -gt 0 ]]; then
    echo "Persisted PATH update in: ${UPDATED_FILES[*]}"
    echo "Log out and back in (or restart GNOME Shell) so the extension sees text-extractor-ocr."
else
    echo "$BIN_DIR already in PATH for future shells."
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
