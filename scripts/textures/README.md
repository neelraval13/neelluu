# Lanyard texture generator

Renders the two PNG textures used by the 3D lanyard badge:

- `public/card-texture.png` - the card face atlas (front + back packed side-by-side, matches the GLB's UV layout)
- `public/card-lanyard.png` - the repeating strap pattern

Both are static assets; regeneration is a **design-time** step, not a build step. You run this only when content changes (new handle, updated role, different monogram letter, etc.), then commit the regenerated PNGs.

## One-time setup

Requires Python 3.8+. On macOS it's preinstalled.

```bash
pip install -r scripts/textures/requirements.txt
```

If you're on a system that complains about global installs (newer macOS, most Linux), add `--break-system-packages` or use a venv:

```bash
python3 -m venv .venv-textures
source .venv-textures/bin/activate
pip install -r scripts/textures/requirements.txt
```

## Regenerating textures

Edit `scripts/textures/config.json`, then from the repo root:

```bash
pnpm textures
# or directly:
python3 scripts/textures/generate.py
```

Output:

```
✓ wrote public/card-texture.png
✓ wrote public/card-lanyard.png
```

Commit both PNGs.

## What you can edit in `config.json`

### Theme
Matches your site's CSS variables. Change here and the textures will follow the site design.

```json
"theme": {
  "bg":     "#0b0b0f",
  "fg":     "#f5f5f7",
  "muted":  "#9a9aa3",
  "accent": "#7c5cff"
}
```

### Front face
```json
"front": {
  "tag":    "PORTFOLIO",          // small letter-spaced header
  "name":   "NEEL RAVAL",          // auto-shrinks if too wide
  "role":   "Software Developer",  // subtitle
  "footer": "neelluu.com",         // bottom accent line
  "monogram": { ... }              // see below
}
```

**Monogram** - two modes:

_Letter mode_ (default):
```json
"monogram": { "mode": "letter", "letter": "N", "image": null }
```
Draws a rounded purple square with the given letter. The letter `N` is hand-drawn geometrically for sharpness at small sizes; any other letter falls back to font-rendered glyph.

_Image mode_ (for custom logos):
```json
"monogram": { "mode": "image", "image": "./logo.png" }
```
Drops in a PNG relative to the `config.json` location. Transparent-background PNG is ideal. Aspect-ratio preserved within a 180×180 square.

### Back face
```json
"back": {
  "header": "CONNECT",
  "handles": [
    { "label": "GITHUB",   "value": "@neelraval13" },
    ...
  ],
  "qr": { "url": "https://neelluu.com", "caption": "SCAN → NEELLUU.COM" }
}
```

**Handles** - add/remove freely (3 to 8 works well; more gets cramped). Row height auto-scales to fit within the available space.

### Strap (lanyard ribbon)
```json
"strap": {
  "text":            "NEELLUU.COM",
  "monogram_letter": "N",
  "background":      "accent"      // "accent" (purple) or "dark"
}
```

### Output paths
```json
"output": {
  "card_path":  "public/card-texture.png",
  "strap_path": "public/card-lanyard.png"
}
```

Relative to the repo root. Don't change these unless you also update the Astro component's import paths.

## What's *not* configurable

The overall layout (centered hierarchy on front, stacked handles + QR on back) is hardcoded in `generate.py`. Layout changes require editing the Python code itself - the config is intentionally content-only, because layout changes need judgment calls that a JSON schema can't express cleanly.

If you need a layout change - different arrangement, landscape orientation, a photo on the card, etc. - edit the `build_front` / `build_back` functions in `generate.py` directly. They're well-commented and each face is ~50 lines.

## Why Python for this?

Texture generation is offline tooling - nothing ships to users, nothing runs at build time. Python with Pillow gives us the fastest iteration for 2D image composition, and the `qrcode[pil]` library is more mature than any Node equivalent. Adding Node/canvas dependencies to the project just for occasional texture regeneration would bloat `node_modules` unnecessarily. The generated PNGs are what the runtime actually uses; the script is just a tool.
