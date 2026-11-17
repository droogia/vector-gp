"""Draws the app icons (icons/*.png): a glowing green circuit on black. Needs Pillow.
   python tools/make_icons.py"""
import math, os
from PIL import Image, ImageChops, ImageDraw, ImageFilter

G = (57, 255, 20)
OUT = os.path.join(os.path.dirname(__file__), '..', 'icons')

def circuit(cx, cy, r):
    """A closed track outline (a bean with a hairpin), as points around (cx, cy)."""
    pts = []
    for i in range(240):
        t = i / 240 * 2 * math.pi
        x = math.cos(t) * (1 + 0.28 * math.cos(2 * t + 0.6)) + 0.12 * math.sin(3 * t)
        y = 0.62 * math.sin(t) * (1 + 0.25 * math.sin(2 * t - 0.4))
        pts.append((cx + x * r * 0.62, cy + y * r * 0.62))
    return pts

def icon(size, pad=0.0):
    S = size * 4
    r = S / 2 * (1 - pad)
    pts = circuit(S / 2, S / 2, r)
    art = Image.new('RGB', (S, S), (0, 0, 0))
    d = ImageDraw.Draw(art)
    w = max(4, int(S * 0.04))
    d.line(pts + [pts[0]], fill=G, width=w, joint='curve')
    (x0, y0), (x1, y1) = pts[0], pts[3]            # start/finish bar, across the track
    L = math.hypot(x1 - x0, y1 - y0) or 1
    nx, ny = -(y1 - y0) / L, (x1 - x0) / L
    d.line([(x0 - nx * w * 1.8, y0 - ny * w * 1.8), (x0 + nx * w * 1.8, y0 + ny * w * 1.8)], fill=G, width=int(w * 0.9))
    glow = art.filter(ImageFilter.GaussianBlur(S * 0.03))
    return ImageChops.add(glow, art).resize((size, size), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
icon(192).save(os.path.join(OUT, 'icon-192.png'))
icon(512).save(os.path.join(OUT, 'icon-512.png'))
icon(512, pad=0.18).save(os.path.join(OUT, 'icon-maskable-512.png'))   # keeps the art inside the safe zone
icon(180).save(os.path.join(OUT, 'apple-touch-icon.png'))
print('icons written to', os.path.normpath(OUT))
