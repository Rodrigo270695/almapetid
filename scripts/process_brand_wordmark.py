"""Wordmark en negro → PNG blanco con alpha (recortes transparentes)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

SRC = Path(
    r'C:\Users\rodri\.cursor\projects\d-Programacion-Laravel-LaraReact-vetsaas'
    r'\assets\almapet-wordmark-on-black.png'
)
OUT_DIR = Path(r'd:\Programacion\Laravel\LaraReact\almapetid\public\brand')
BRAND_SKY = (0, 117, 152)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    im = Image.open(SRC).convert('RGBA')
    pixels = im.load()
    w, h = im.size

    for y in range(h):
        for x in range(w):
            r, g, b, _a = pixels[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum < 90:
                # Fondo / recortes negros → transparentes
                pixels[x, y] = (255, 255, 255, 0)
            elif lum > 180:
                pixels[x, y] = (255, 255, 255, 255)
            else:
                # Antialias: alpha proporcional
                t = (lum - 90) / (180 - 90)
                pixels[x, y] = (255, 255, 255, max(0, min(255, int(t * 255))))

    bbox = im.getbbox()
    if not bbox:
        raise SystemExit('No content found')

    pad = 12
    im = im.crop(
        (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad),
        )
    )

    # Altura web ~56px, escala proporcional
    target_h = 112
    scale = target_h / im.size[1]
    im = im.resize(
        (max(1, int(im.size[0] * scale)), target_h),
        Image.Resampling.LANCZOS,
    )

    out_white = OUT_DIR / 'almapet-id-wordmark.png'
    im.save(out_white, 'PNG', optimize=True)
    print(f'saved {out_white} {im.size}')

    sky = im.copy()
    sp = sky.load()
    for y in range(sky.size[1]):
        for x in range(sky.size[0]):
            _r, _g, _b, a = sp[x, y]
            if a > 0:
                sp[x, y] = (*BRAND_SKY, a)

    out_sky = OUT_DIR / 'almapet-id-wordmark-sky.png'
    sky.save(out_sky, 'PNG', optimize=True)
    print(f'saved {out_sky} {sky.size}')


if __name__ == '__main__':
    main()
