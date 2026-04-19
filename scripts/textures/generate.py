#!/usr/bin/env python3
"""
Lanyard texture generator — config-driven.

Reads ./config.json and renders two PNGs:
  • card-texture.png   (2048×2048 atlas: left half = front, right half = back)
  • card-lanyard.png   (1024×260 strap, tiled 4× by the R3F component)

Layout is fixed; content is driven by config.json. Change the JSON, rerun:
  python3 scripts/textures/generate.py

Requires:
  pip install Pillow "qrcode[pil]"
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from qrcode.constants import ERROR_CORRECT_H
from qrcode.image.pil import PilImage

# ─────────────────────────────────────────────────────────────────────────────
# Constants derived from the GLB's UV atlas
# ─────────────────────────────────────────────────────────────────────────────
CARD_W, CARD_H = 2048, 2048
CONTENT_H = int(CARD_H * 0.755)  # top 75.5% is visible; bottom is under clip
HALF_W = 1024  # each face occupies half the atlas width
PAD = 72  # inner padding within each face

STRAP_W, STRAP_H = 1024, 260

# ─────────────────────────────────────────────────────────────────────────────
# Font discovery — tries common paths across macOS / Linux
# ─────────────────────────────────────────────────────────────────────────────
FONT_CANDIDATES = {
    "bold": [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ],
    "regular": [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ],
    "mono": [
        "/System/Library/Fonts/Menlo.ttc",
        "/System/Library/Fonts/Monaco.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ],
}


def load_font(kind: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in FONT_CANDIDATES[kind]:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


# ─────────────────────────────────────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────────────────────────────────────
def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore


def letter_spaced(text: str) -> str:
    """Turn 'CONNECT' into 'C O N N E C T' for tracking effect at small sizes."""
    return " ".join(text.upper())


def soft_glow(
    size: tuple[int, int],
    bbox: tuple[int, int, int, int],
    color: tuple[int, int, int],
    alpha: int,
    blur: int = 160,
) -> Image.Image:
    w, h = size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(bbox, fill=(*color, alpha))
    return layer.filter(ImageFilter.GaussianBlur(radius=blur))


# ─────────────────────────────────────────────────────────────────────────────
# Monogram rendering — shared between card front and strap
# ─────────────────────────────────────────────────────────────────────────────
def draw_letter_monogram(
    canvas: Image.Image, x: int, y: int, size: int, letter: str, bg: tuple, fg: tuple
) -> None:
    """Rounded-square badge with the letter drawn geometrically (N/M/W/etc).

    Uses stroke-and-line geometry rather than font glyph for crisp tiny sizes.
    For letters other than N, we fall back to a real font render.
    """
    r = int(size * 0.22)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((x, y, x + size, y + size), radius=r, fill=bg)

    if letter.upper() == "N":
        stroke = max(4, size // 7)
        pad = size // 4
        x0, x1 = x + pad, x + size - pad
        y0, y1 = y + pad, y + size - pad
        d.rectangle((x0, y0, x0 + stroke, y1), fill=fg)  # left vertical
        d.rectangle((x1 - stroke, y0, x1, y1), fill=fg)  # right vertical
        d.line((x0 + stroke, y0, x1 - stroke, y1), fill=fg, width=stroke)  # diagonal
    else:
        # Fallback for other letters — render from font, centered
        f = load_font("bold", int(size * 0.6))
        bbox = d.textbbox((0, 0), letter.upper(), font=f)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.text(
            (x + (size - tw) / 2 - bbox[0], y + (size - th) / 2 - bbox[1]),
            letter.upper(),
            font=f,
            fill=fg,
        )


def draw_image_monogram(
    canvas: Image.Image, x: int, y: int, size: int, image_path: Path
) -> None:
    """Drop in a user-supplied PNG as the monogram (e.g. a logo mark)."""
    if not image_path.exists():
        raise FileNotFoundError(f"Monogram image not found: {image_path}")
    logo = Image.open(image_path).convert("RGBA")
    # Preserve aspect ratio, fit within the square
    logo.thumbnail((size, size), Image.Resampling.LANCZOS)
    lx = x + (size - logo.size[0]) // 2
    ly = y + (size - logo.size[1]) // 2
    canvas.alpha_composite(logo, (lx, ly))


def render_monogram(
    canvas: Image.Image,
    x: int,
    y: int,
    size: int,
    spec: dict,
    theme: dict,
    config_dir: Path,
    bg: tuple | None = None,
    fg: tuple | None = None,
) -> None:
    """Dispatch to letter or image mode based on spec."""
    accent = hex_to_rgb(theme["accent"])
    fg_col = hex_to_rgb(theme["fg"])

    if spec.get("mode") == "image" and spec.get("image"):
        draw_image_monogram(canvas, x, y, size, (config_dir / spec["image"]).resolve())
    else:
        draw_letter_monogram(
            canvas,
            x,
            y,
            size,
            spec.get("letter", "N"),
            bg if bg is not None else accent,
            fg if fg is not None else fg_col,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Card face builders
# ─────────────────────────────────────────────────────────────────────────────
def build_front(canvas: Image.Image, cfg: dict, theme: dict, config_dir: Path) -> None:
    x0 = 0
    bg = hex_to_rgb(theme["bg"])
    fg = hex_to_rgb(theme["fg"])
    muted = hex_to_rgb(theme["muted"])
    accent = hex_to_rgb(theme["accent"])

    d = ImageDraw.Draw(canvas)
    d.rectangle((x0, 0, x0 + HALF_W, CONTENT_H), fill=bg)
    glow = soft_glow((HALF_W, CONTENT_H), (-320, -320, 680, 680), accent, 120)
    canvas.alpha_composite(glow, (x0, 0))

    # Tag (letter-spaced, uppercase, muted)
    tag_font = load_font("bold", 32)
    tag = letter_spaced(cfg["tag"])
    tw = d.textlength(tag, font=tag_font)
    d.text((x0 + (HALF_W - tw) / 2, 220), tag, font=tag_font, fill=muted)

    # Monogram
    mono_size = 180
    render_monogram(
        canvas,
        x0 + (HALF_W - mono_size) // 2,
        300,
        mono_size,
        cfg["monogram"],
        theme,
        config_dir,
    )

    # Name — fit-to-width: shrink font size if the name is too long
    name = cfg["name"]
    name_size = 120
    name_font = load_font("bold", name_size)
    while d.textlength(name, font=name_font) > HALF_W - 2 * PAD and name_size > 60:
        name_size -= 4
        name_font = load_font("bold", name_size)
    nw = d.textlength(name, font=name_font)
    d.text((x0 + (HALF_W - nw) / 2, 560), name, font=name_font, fill=fg)

    # Purple underline
    d.rectangle(
        (x0 + (HALF_W - 140) // 2, 720, x0 + (HALF_W + 140) // 2, 726),
        fill=accent,
    )

    # Role
    role_font = load_font("regular", 56)
    rw = d.textlength(cfg["role"], font=role_font)
    d.text((x0 + (HALF_W - rw) / 2, 770), cfg["role"], font=role_font, fill=muted)

    # Footer — accent mono
    foot_font = load_font("mono", 36)
    fw = d.textlength(cfg["footer"], font=foot_font)
    d.text(
        (x0 + (HALF_W - fw) / 2, CONTENT_H - 180),
        cfg["footer"],
        font=foot_font,
        fill=accent,
    )


def build_back(canvas: Image.Image, cfg: dict, theme: dict) -> None:
    x0 = HALF_W
    bg = hex_to_rgb(theme["bg"])
    fg = hex_to_rgb(theme["fg"])
    muted = hex_to_rgb(theme["muted"])
    accent = hex_to_rgb(theme["accent"])
    dim = tuple(min(255, c + 14) for c in bg)  # subtle separator

    d = ImageDraw.Draw(canvas)
    d.rectangle((x0, 0, x0 + HALF_W, CONTENT_H), fill=bg)
    glow = soft_glow(
        (HALF_W, CONTENT_H),
        (HALF_W - 680, CONTENT_H - 680, HALF_W + 320, CONTENT_H + 320),
        accent,
        120,
    )
    canvas.alpha_composite(glow, (x0, 0))

    # Header
    header_font = load_font("bold", 32)
    header = letter_spaced(cfg["header"])
    hw = d.textlength(header, font=header_font)
    d.text((x0 + (HALF_W - hw) / 2, 150), header, font=header_font, fill=muted)
    d.rectangle(
        (x0 + (HALF_W - 80) // 2, 215, x0 + (HALF_W + 80) // 2, 219),
        fill=accent,
    )

    # Handles block — dynamic row height based on count
    handles = cfg["handles"]
    n = len(handles)
    if n == 0:
        raise ValueError("At least one handle is required")

    handles_y_start = 275
    qr_block_height = 440  # QR + border + caption + padding
    bottom_margin = 40
    available = CONTENT_H - handles_y_start - qr_block_height - bottom_margin
    row_h = max(70, min(140, available // n))

    # Scale fonts with row height
    label_size = max(20, min(28, row_h // 4))
    value_size = max(26, min(40, row_h // 2 - 12))
    label_font = load_font("bold", label_size)
    value_font = load_font("mono", value_size)

    y = handles_y_start
    for h in handles:
        d.text((x0 + PAD, y), h["label"], font=label_font, fill=accent)
        d.text((x0 + PAD, y + label_size + 6), h["value"], font=value_font, fill=fg)
        # Separator
        d.rectangle(
            (x0 + PAD, y + row_h - 10, x0 + HALF_W - PAD, y + row_h - 8),
            fill=dim,
        )
        y += row_h

    # QR code
    qr = qrcode.QRCode(
        version=3,
        error_correction=ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(cfg["qr"]["url"])
    qr.make(fit=True)
    # Force the PIL-backed factory so .get_image() returns a real PIL.Image.
    qr_pil: PilImage = qr.make_image(
        image_factory=PilImage, fill_color=fg, back_color=bg
    )
    qr_img = qr_pil.get_image().convert("RGBA")
    qr_size = 280
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)

    qr_x = x0 + (HALF_W - qr_size) // 2
    qr_y = CONTENT_H - qr_size - 130
    d.rounded_rectangle(
        (qr_x - 20, qr_y - 20, qr_x + qr_size + 20, qr_y + qr_size + 20),
        radius=18,
        outline=accent,
        width=3,
    )
    canvas.alpha_composite(qr_img, (qr_x, qr_y))

    # Caption under QR
    scan_font = load_font("bold", 20)
    scan = letter_spaced(cfg["qr"]["caption"]).replace("S C A N   → ", "S C A N   →   ")
    sw = d.textlength(scan, font=scan_font)
    d.text(
        (x0 + (HALF_W - sw) / 2, qr_y + qr_size + 40), scan, font=scan_font, fill=muted
    )


# ─────────────────────────────────────────────────────────────────────────────
# Strap builder
# ─────────────────────────────────────────────────────────────────────────────
def build_strap(cfg: dict, theme: dict) -> Image.Image:
    fg = hex_to_rgb(theme["fg"])
    accent = hex_to_rgb(theme["accent"])
    bg = hex_to_rgb(theme["bg"])

    # Strap bg: "accent" (purple) or "dark"
    strap_bg = accent if cfg.get("background", "accent") == "accent" else bg
    strap_fg = fg if strap_bg == accent else accent

    img = Image.new("RGBA", (STRAP_W, STRAP_H), (*strap_bg, 255))
    d = ImageDraw.Draw(img)

    # Center monogram — inverted palette vs strap
    mono_size = 130
    cx, cy = STRAP_W // 2, STRAP_H // 2
    mx, my = cx - mono_size // 2, cy - mono_size // 2
    draw_letter_monogram(
        img,
        mx,
        my,
        mono_size,
        cfg.get("monogram_letter", "N"),
        bg=strap_fg,  # inverted: white on purple strap
        fg=strap_bg,
    )

    # Flanking text
    text = letter_spaced(cfg["text"])
    txt_font = load_font("bold", 22)
    tw = d.textlength(text, font=txt_font)
    muted_on_strap = tuple(
        int(c * 0.85 + 40) for c in strap_fg
    )  # softened version of strap_fg
    d.text(
        (cx - mono_size // 2 - 60 - tw, cy - 12),
        text,
        font=txt_font,
        fill=muted_on_strap,
    )
    d.text(
        (cx + mono_size // 2 + 60, cy - 12), text, font=txt_font, fill=muted_on_strap
    )

    return img.convert("RGB")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────
def main() -> int:
    script_dir = Path(__file__).resolve().parent
    config_path = script_dir / "config.json"

    if not config_path.exists():
        print(f"error: config.json not found at {config_path}", file=sys.stderr)
        return 1

    with config_path.open() as f:
        cfg = json.load(f)

    theme = cfg["theme"]
    repo_root = script_dir.parent.parent  # scripts/textures/ -> scripts/ -> repo

    # Build card atlas
    atlas = Image.new("RGBA", (CARD_W, CARD_H), (0, 0, 0, 0))
    build_front(atlas, cfg["front"], theme, script_dir)
    build_back(atlas, cfg["back"], theme)

    card_out = repo_root / cfg["output"]["card_path"]
    card_out.parent.mkdir(parents=True, exist_ok=True)
    atlas.convert("RGB").save(card_out, "PNG", optimize=True)
    print(f"✓ wrote {card_out.relative_to(repo_root)}")

    # Build strap
    strap = build_strap(cfg["strap"], theme)
    strap_out = repo_root / cfg["output"]["strap_path"]
    strap_out.parent.mkdir(parents=True, exist_ok=True)
    strap.save(strap_out, "PNG", optimize=True)
    print(f"✓ wrote {strap_out.relative_to(repo_root)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
