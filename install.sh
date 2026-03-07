#!/bin/bash

# Install & Build script for Text Extractor GNOME Extension

set -u

EXTENSION_UUID="text-extractor@aditya190803"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
SOURCE_DIR="build"
BIN_DIR="$HOME/.local/bin"
OCR_HELPER="$BIN_DIR/text-extractor-ocr"

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

run_with_optional_sudo() {
    if [ -n "$SUDO_CMD" ]; then
        "$SUDO_CMD" "$@"
    else
        "$@"
    fi
}

install_system_deps() {
    case "$PKG_MANAGER" in
        apt)
            run_with_optional_sudo apt-get update -y && \
            run_with_optional_sudo apt-get install -y tesseract-ocr tesseract-ocr-eng python3 python3-pip zip ;;
        dnf)
            run_with_optional_sudo dnf install -y tesseract tesseract-langpack-eng python3 python3-pip zip ;;
        pacman)
            run_with_optional_sudo pacman -Sy --noconfirm tesseract tesseract-data-eng python python-pip zip ;;
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
        if python3 -m pip --version >/dev/null 2>&1; then
            echo "Installing Python module $pip_name (user scope)..."
            python3 -m pip install --user "$pip_name"
        else
            echo "ERROR: python3-pip not found. Please install python3-pip."
            return 1
        fi
    fi
}

install_ocr_helper() {
    mkdir -p "$BIN_DIR"
    cp "$SOURCE_DIR/ocr_helper.py" "$OCR_HELPER"
    chmod +x "$OCR_HELPER"

    if command -v text-extractor-ocr >/dev/null 2>&1; then
        echo "OCR helper is available on PATH."
        return 0
    fi

    if [ -n "$SUDO_CMD" ] || [ "$EUID" -eq 0 ]; then
        echo "Creating system launcher in /usr/local/bin..."
        run_with_optional_sudo tee /usr/local/bin/text-extractor-ocr >/dev/null <<EOF
#!/bin/sh
exec "$OCR_HELPER" "\$@"
EOF
        run_with_optional_sudo chmod 755 /usr/local/bin/text-extractor-ocr
        echo "OCR helper is available system-wide via /usr/local/bin/text-extractor-ocr."
        return 0
    fi

    echo "Installed OCR helper to $OCR_HELPER."
    echo "GNOME Shell will use the absolute path automatically even if ~/.local/bin is not in PATH."
}

echo "Checking and installing dependencies..."
detect_pkg_manager
prepare_sudo

if ! install_system_deps; then
    echo "Continuing with extension install, but system dependencies may still be missing."
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "ERROR: Python3 is required but not installed."
    exit 1
fi

ensure_python_module "pytesseract" "pytesseract" || exit 1
ensure_python_module "PIL" "Pillow" || exit 1

if ! command -v tesseract >/dev/null 2>&1; then
    echo "ERROR: Tesseract OCR binary is still not available after dependency installation."
    echo "Install it manually, then re-run this script."
    exit 1
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

# Install OCR helper
echo "Installing OCR helper script..."
install_ocr_helper

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
