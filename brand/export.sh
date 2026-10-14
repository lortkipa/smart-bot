#!/usr/bin/env bash
# Renders every raster brand asset from the SVG sources in logo/ and icon/.
# Requires: rsvg-convert (librsvg) and magick (ImageMagick 7).
set -euo pipefail
cd "$(dirname "$0")"

out=export
rm -rf "$out"
mkdir -p "$out"/{web,ios,android,desktop,social}

png() { rsvg-convert -w "$2" -h "$2" "$1" -o "$3"; }

# Web
for s in 16 32 48; do png icon/app-icon-small.svg "$s" "$out/web/favicon-$s.png"; done
magick "$out"/web/favicon-{16,32,48}.png "$out/web/favicon.ico"
rm "$out"/web/favicon-{16,48}.png
cp icon/favicon.svg "$out/web/favicon.svg"
png icon/app-icon.svg 180 "$out/web/apple-touch-icon.png"
png icon/app-icon-rounded.svg 192 "$out/web/icon-192.png"
png icon/app-icon-rounded.svg 512 "$out/web/icon-512.png"
png icon/maskable.svg 512 "$out/web/icon-maskable-512.png"

# iOS / Expo / Tauri source: one full-bleed 1024 icon, no transparency
png icon/app-icon.svg 1024 "$out/ios/app-icon-1024.png"
magick "$out/ios/app-icon-1024.png" -alpha off "$out/ios/app-icon-1024.png"

# Android adaptive icon layers (432px = 108dp at xxxhdpi) and Play Store icon
png icon/android-foreground.svg 432 "$out/android/ic_launcher_foreground.png"
png icon/android-background.svg 432 "$out/android/ic_launcher_background.png"
png icon/android-monochrome.svg 432 "$out/android/ic_launcher_monochrome.png"
png icon/app-icon.svg 512 "$out/android/play-store-512.png"

# Desktop (macOS, Windows, Linux)
for s in 16 24 32; do png icon/app-icon-small.svg "$s" "$out/desktop/icon-$s.png"; done
for s in 48 64 128 256 512 1024; do png icon/app-icon-rounded.svg "$s" "$out/desktop/icon-$s.png"; done
magick "$out"/desktop/icon-{16,24,32,48,64,256}.png "$out/desktop/icon.ico"

# Social preview (Open Graph, 1200x630)
rsvg-convert -h 120 logo/lockup-dark.svg -o "$out/social/lockup.png"
magick -size 1200x630 xc:'#000000' "$out/social/lockup.png" -gravity center -composite "$out/social/og-image.png"
rm "$out/social/lockup.png"

echo "Exported to $(pwd)/$out"
