# Smart Bot brand

The mark is a **viewfinder**: two framing corners around a live dot. You can look in on your agent's desktop at any time, and the dot shows the agent is on.

The SVG files in `logo/` and `icon/` are the sources. Everything in `export/` is generated from them by `./export.sh` (needs `rsvg-convert` and ImageMagick 7). Don't edit the exports by hand.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| Black | `#000000` | Mark corners and wordmark on light backgrounds; app icon tile |
| White | `#FFFFFF` | Mark corners and wordmark on dark backgrounds |
| Signal Blue | `#2F7BFF` | The dot, on light backgrounds and on the black app icon |
| Signal Blue (dark) | `#4D8FFF` | The dot on dark backgrounds |

Blue appears only on the dot. Everything else is black or white.

## Logo files

| File | Use |
| --- | --- |
| `logo/lockup.svg` | Default logo: mark + "Smart Bot", on light backgrounds |
| `logo/lockup-dark.svg` | Same, on dark backgrounds |
| `logo/lockup-black.svg`, `logo/lockup-white.svg` | One-color versions (print, embossing, single-ink use) |
| `logo/mark.svg`, `logo/mark-dark.svg` | Mark alone, from 32px and up |
| `logo/mark-small.svg`, `logo/mark-small-dark.svg` | Heavier mark for 16 to 31px |
| `logo/mark-black.svg`, `logo/mark-white.svg` | One-color mark |

The wordmark is Instrument Sans SemiBold (600), kerned and converted to outlines, so the files don't need the font installed. Instrument Sans is licensed under the SIL Open Font License.

## Icons

| Source | Exports | Platform |
| --- | --- | --- |
| `icon/app-icon.svg` | `export/ios/app-icon-1024.png`, `export/android/play-store-512.png`, `export/web/apple-touch-icon.png` | Full-bleed square. iOS, Expo and Play Store apply their own corner mask. Full-bleed, for platforms that mask icons themselves |
| `icon/app-icon-rounded.svg` | `export/desktop/icon-48…1024.png`, `export/web/icon-192/512.png` | Rounded tile with margin: macOS, Windows, Linux, PWA. Also the input for `pnpm tauri icon` in `apps/desktop` |
| `icon/app-icon-small.svg` | `export/desktop/icon-16/24/32.png`, `export/web/favicon.ico`, `export/desktop/icon.ico` | Tighter tile with the heavier mark, for tiny sizes |
| `icon/android-*.svg` | `export/android/ic_launcher_{foreground,background,monochrome}.png` | Android adaptive and themed icons |
| `icon/maskable.svg` | `export/web/icon-maskable-512.png` | PWA maskable icon |
| `icon/favicon.svg` | `export/web/favicon.svg` | Browser favicon; switches to white corners in dark mode |

`export/social/og-image.png` (1200×630) is the link preview image.

## Usage rules

- **Clear space:** keep empty space around the logo at least the width of the dot on every side.
- **Minimum size:** lockup 96px wide; mark 16px (use the `mark-small` files below 32px).
- **Backgrounds:** black logo on white or light grey, white logo on black or dark grey. On photos or busy backgrounds, use the app icon tile instead.
- **Don't:** recolor the corners, add a color other than Signal Blue to the dot, rotate or mirror the mark (the corners always sit top-left and bottom-right), add effects or outlines, or reset the wordmark in another font.
