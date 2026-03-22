#!/bin/bash

# Install & Build script for Text Extractor GNOME Extension

set -u

EXTENSION_UUID="text-extractor@aditya190803"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
SOURCE_DIR="build"
BIN_DIR="$HOME/.local/bin"
OCR_HELPER="$BIN_DIR/text-extractor-ocr"

OS_ID=""
OS_ID_LIKE=""

echo "Installing Text Extractor Extension..."

# --- Dependency install (system + Python) ---

PKG_MANAGER=""
SUDO_CMD=""

read_os_release() {
    if [ -r /etc/os-release ]; then
        # shellcheck disable=SC1091
        . /etc/os-release
        OS_ID="${ID:-}"
        OS_ID_LIKE="${ID_LIKE:-}"
    fi
}

detect_pkg_manager() {
    read_os_release

    case "$OS_ID" in
        ubuntu|debian|linuxmint|pop|elementary|zorin|kali|neon)
            PKG_MANAGER="apt"
            return 0 ;;
        fedora|rhel|centos|rocky|almalinux|ol)
            PKG_MANAGER="dnf"
            return 0 ;;
        arch|manjaro|endeavouros|garuda|cachyos)
            PKG_MANAGER="pacman"
            return 0 ;;
        opensuse*|sles|sled)
            PKG_MANAGER="zypper"
            return 0 ;;
    esac

    case "$OS_ID_LIKE" in
        *debian*)
            PKG_MANAGER="apt"
            return 0 ;;
        *fedora*|*rhel*)
            PKG_MANAGER="dnf"
            return 0 ;;
        *arch*)
            PKG_MANAGER="pacman"
            return 0 ;;
        *suse*)
            PKG_MANAGER="zypper"
            return 0 ;;
    esac

    if command -v apt-get >/dev/null 2>&1; then
        PKG_MANAGER="apt"
    elif command -v dnf >/dev/null 2>&1; then
        PKG_MANAGER="dnf"
    elif command -v pacman >/dev/null 2>&1; then
        PKG_MANAGER="pacman"
    elif command -v zypper >/dev/null 2>&1; then
        PKG_MANAGER="zypper"
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

install_debian_packages() {
    run_with_optional_sudo apt-get update -y && \
    run_with_optional_sudo apt-get install -y tesseract-ocr tesseract-ocr-eng python3 python3-pytesseract python3-pil zip
}

install_fedora_packages() {
    run_with_optional_sudo dnf install -y tesseract tesseract-langpack-eng python3 python3-pytesseract python3-pillow zip
}

install_arch_packages() {
    run_with_optional_sudo pacman -Sy --noconfirm tesseract tesseract-data-eng python python-pytesseract python-pillow zip
}

install_suse_packages() {
    run_with_optional_sudo zypper install -y tesseract tesseract-data-eng python3 python3-pytesseract python3-Pillow zip
}

install_system_deps() {
    case "$PKG_MANAGER" in
        apt)
            install_debian_packages ;;
        dnf)
            install_fedora_packages ;;
        pacman)
            install_arch_packages ;;
        zypper)
            install_suse_packages ;;
        *)
            echo "WARNING: No supported package manager detected. Install Tesseract, Python OCR bindings, and zip manually.";
            return 1 ;;
    esac
}

ensure_runtime_tools() {
    if ! command -v tesseract >/dev/null 2>&1; then
        echo "ERROR: Tesseract OCR binary is still not available after dependency installation."
        echo "Install it manually, then re-run this script."
        return 1
    fi

    if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1 && ! command -v py >/dev/null 2>&1; then
        echo "ERROR: Python is required but not installed."
        return 1
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

if ! ensure_runtime_tools; then
    exit 1
fi

# --- Build Step ---
echo "Building extension..."

# Create distribution package (optional, for distribution)
echo "Creating distribution package..."
if [ -d "$SOURCE_DIR" ]; then
    if command -v zip &> /dev/null; then
        rm -f "$EXTENSION_UUID.zip"
        (
            cd "$SOURCE_DIR" &&
            zip -r "../$EXTENSION_UUID.zip" . \
                -x "ocr_helper.py" "__pycache__/*" "__pycache__" "*.pyc"
        )
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
