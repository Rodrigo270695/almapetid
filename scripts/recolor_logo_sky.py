"""Recolorea logo-source.png a celeste AlmaPet y elimina el fondo negro."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'public' / 'logo-source.png'
ALT = ROOT / 'public' / 'logo copy.png'
OUT = ROOT / 'public' / 'logo.png'
MAX_SIDE = 1024

# Celeste AlmaPet — oklch(0.52 0.11 225) y variantes de luminancia
DARK_SKY = (0, 88, 122)
MID_SKY = (0, 117, 152)
LIGHT_SKY = (31, 147, 184)


def is_background(r: int, g: int, b: int) -> bool:
    return r + g + b < 35 or max(r, g, b) < 18


def recolor_pixel(r: int, g: int, b: int) -> tuple[int, int, int]:
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    t = (lum - 46) / (220 - 46)
    t = max(0.0, min(1.0, t))

    if t < 0.5:
        k = t / 0.5
        nr = int(DARK_SKY[0] + (MID_SKY[0] - DARK_SKY[0]) * k)
        ng = int(DARK_SKY[1] + (MID_SKY[1] - DARK_SKY[1]) * k)
        nb = int(DARK_SKY[2] + (MID_SKY[2] - DARK_SKY[2]) * k)
    else:
        k = (t - 0.5) / 0.5
        nr = int(MID_SKY[0] + (LIGHT_SKY[0] - MID_SKY[0]) * k)
        ng = int(MID_SKY[1] + (LIGHT_SKY[1] - MID_SKY[1]) * k)
        nb = int(MID_SKY[2] + (LIGHT_SKY[2] - MID_SKY[2]) * k)

    return nr, ng, nb


def main() -> None:
    source = SRC if SRC.exists() else ALT
    img = Image.open(source).convert('RGBA')

    w, h = img.size
    longest = max(w, h)
    if longest > MAX_SIDE:
        scale = MAX_SIDE / longest
        img = img.resize(
            (max(1, int(w * scale)), max(1, int(h * scale))),
            Image.Resampling.LANCZOS,
        )

    pixels = img.load()
    w, h = img.size
    transparent = 0

    for y in range(h):
        for x in range(w):
            r, g, b, _a = pixels[x, y]
            if is_background(r, g, b):
                pixels[x, y] = (0, 0, 0, 0)
                transparent += 1
                continue

            nr, ng, nb = recolor_pixel(r, g, b)
            pixels[x, y] = (nr, ng, nb, 255)

    img.save(OUT, 'PNG', optimize=True)
    print(f'Origen: {source}')
    print(f'Guardado: {OUT} ({w}x{h})')
    print(f'Pixeles transparentes: {transparent}')


if __name__ == '__main__':
    main()
