#!/usr/bin/env python3
"""Regenerate the site favicon set from images/logo-black.png.

The source logo is a dark "cg" glyph on transparency, which disappears against
dark browser tab bars. So we knock the glyph out in white on a solid brand
coral tile: legible at 16px, and identical in light and dark UI.

Run from dist/:  python3 tools/build-favicons.py
"""
from pathlib import Path
from PIL import Image

DIST = Path(__file__).resolve().parent.parent
SRC = DIST / "images" / "logo-black.png"
BRAND = (255, 81, 48, 255)   # #FF5130
GLYPH = (255, 255, 255, 255)
PAD = 0.16                   # share of the tile left as margin on each side

# Render once, large, then downsample for each target size.
MASTER = 1024


def render(size: int) -> Image.Image:
    logo = Image.open(SRC).convert("RGBA")
    glyph = logo.getchannel("A").crop(logo.getchannel("A").getbbox())

    box = int(MASTER * (1 - 2 * PAD))
    scale = min(box / glyph.width, box / glyph.height)
    glyph = glyph.resize(
        (max(1, round(glyph.width * scale)), max(1, round(glyph.height * scale))),
        Image.LANCZOS,
    )

    tile = Image.new("RGBA", (MASTER, MASTER), BRAND)
    ink = Image.new("RGBA", glyph.size, GLYPH)
    tile.paste(ink, ((MASTER - glyph.width) // 2, (MASTER - glyph.height) // 2), glyph)
    return tile.resize((size, size), Image.LANCZOS)


def main() -> None:
    render(32).save(DIST / "favicon-32.png")
    render(16).save(DIST / "favicon-16.png")
    render(180).convert("RGB").save(DIST / "apple-touch-icon.png")
    render(192).save(DIST / "icon-192.png")
    render(512).save(DIST / "icon-512.png")

    # Multi-resolution .ico so /favicon.ico works even where no <link> is parsed.
    render(48).save(
        DIST / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    for name in (
        "favicon.ico favicon-16.png favicon-32.png apple-touch-icon.png "
        "icon-192.png icon-512.png"
    ).split():
        print(f"  wrote {name} ({(DIST / name).stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
