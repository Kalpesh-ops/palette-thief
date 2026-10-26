# Palette Thief

A browser-only color palette studio. Upload or drop an image to extract six dominant colors, then lock, shuffle, copy, customize, and export the palette as CSS variables. Image pixels are processed locally with the Canvas API; there is no server, account, or external image service.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). To create a production build locally, run:

```bash
npm run build
npm run preview
```

The deployable static files are written to `dist/`. Vite is configured with a relative base path for static hosting.

## Use the studio

- Choose **Upload image** or drag an image onto the page. JPG, PNG, and WebP are supported by the browser.
- Copy HEX or RGB values from each swatch. Lock colors before shuffling to keep them in place.
- Generate a neighboring shade, add a custom color, or shuffle the unlocked colors.
- Export the current palette as `palette-thief.css`.

Google Fonts (Outfit and DM Mono) are optional visual enhancements; local system fallbacks keep the app usable offline.
