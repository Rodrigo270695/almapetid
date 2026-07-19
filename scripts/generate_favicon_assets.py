"""Genera favicon.ico y PNGs de pestaña (sin círculo blanco) desde public/logo.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'public' / 'logo.png'
PUBLIC = ROOT / 'public'

SIZES_ICO = (16, 32, 48)
SIZES_FAVICON = (16, 32)


def crop_to_content(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    if bbox is None:
        return img
    return img.crop(bbox)


def fit_square(
    img: Image.Image,
    size: int,
    *,
    background: tuple[int, int, int, int] | None,
) -> Image.Image:
    content = crop_to_content(img)
    cw, ch = content.size
    pad_ratio = 0.12
    inner = int(size * (1 - pad_ratio * 2))
    scale = min(inner / cw, inner / ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    resized = content.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (size, size), background or (0, 0, 0, 0))
    ox = (size - nw) // 2
    oy = (size - nh) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def main() -> None:
    src = Image.open(SRC).convert('RGBA')

    ico_images = [fit_square(src, s, background=None) for s in SIZES_ICO]
    ico_path = PUBLIC / 'favicon.ico'
    ico_images[0].save(
        ico_path,
        format='ICO',
        sizes=[(s, s) for s in SIZES_ICO],
        append_images=ico_images[1:],
    )

    for size in SIZES_FAVICON:
        icon = fit_square(src, size, background=None)
        icon.save(PUBLIC / f'favicon-{size}x{size}.png', 'PNG')

    print('Generados en public/:')
    print('  favicon.ico')
    for size in SIZES_FAVICON:
        print(f'  favicon-{size}x{size}.png')


if __name__ == '__main__':
    main()
