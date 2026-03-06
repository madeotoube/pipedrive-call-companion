#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
EXT_DIR="$ROOT_DIR"
OUT_DIR="$ROOT_DIR/dist"
BASENAME="pipedrive-extension"
PARENT_DIR="$(dirname "$EXT_DIR")"
KEY_FILE="$PARENT_DIR/${BASENAME}.pem"
CRX_FILE="$PARENT_DIR/${BASENAME}.crx"

mkdir -p "$OUT_DIR"

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome binary not found at: $CHROME_BIN" >&2
  exit 1
fi

rm -f "$CRX_FILE"

if [[ -f "$KEY_FILE" ]]; then
  echo "Packing with existing key: $KEY_FILE"
  "$CHROME_BIN" \
    --no-message-box \
    --pack-extension="$EXT_DIR" \
    --pack-extension-key="$KEY_FILE"
else
  echo "Packing first release (new key will be generated)..."
  "$CHROME_BIN" \
    --no-message-box \
    --pack-extension="$EXT_DIR"
fi

if [[ ! -f "$CRX_FILE" ]]; then
  echo "Packing failed: CRX not generated." >&2
  exit 1
fi

if [[ ! -f "$KEY_FILE" ]]; then
  echo "Warning: PEM key was not found after packing." >&2
  exit 1
fi

cp -f "$CRX_FILE" "$OUT_DIR/${BASENAME}.crx"
cp -f "$KEY_FILE" "$OUT_DIR/${BASENAME}.pem"

printf "\nPack complete:\n"
echo "- CRX: $OUT_DIR/${BASENAME}.crx"
echo "- PEM: $OUT_DIR/${BASENAME}.pem"
