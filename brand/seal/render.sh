#!/bin/sh
# Builds casata-seal.svg and renders it to transparent PNGs in png/.
# Needs Node, Google Chrome (set CHROME to its binary if it is not in the macOS default place) and sips.
set -e
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
node build.cjs
mkdir -p png
"$CHROME" --headless --disable-gpu --hide-scrollbars --default-background-color=00000000 \
  --force-device-scale-factor=2 --window-size=800,800 \
  --screenshot="$PWD/png/casata-seal-1600.png" "file://$PWD/casata-seal.svg" 2>/dev/null
for n in 512 256 128 64; do
  sips -Z "$n" png/casata-seal-1600.png --out "png/casata-seal-$n.png" >/dev/null
done
ls -l png
