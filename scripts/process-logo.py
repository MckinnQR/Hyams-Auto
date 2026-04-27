"""
One-shot logo processing for Hyams Auto.
Reads source PNG, removes background via rembg, then emits:
  - hyams-logo.png (transparent, 2x for retina)
  - hyams-logo@1x.png
  - icon-{16,32,192,512}.png (square padded)
  - icon-maskable-{192,512}.png (square, safe-zone padded)
  - apple-touch-icon.png (180x180)
  - favicon.ico (16+32 multi)
  - og-image.png (1200x630, dark green bg)
"""
import io
from pathlib import Path
from PIL import Image
from rembg import remove

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "scripts" / "source" / "Hyams.png"
OUT = ROOT / "web_root" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

GREEN_DARK = (15, 56, 34)        # background for og-image
GREEN_BRAND = (27, 94, 42)       # brand primary

print(f"loading {SRC}")
src = Image.open(SRC).convert("RGBA")
print(f"removing background ({src.size})")
no_bg = remove(src)

# trim transparent border
bbox = no_bg.getbbox()
trimmed = no_bg.crop(bbox) if bbox else no_bg
print(f"trimmed to {trimmed.size}")

# save 2x and 1x logos at native, plus a fixed-height 96px version
trimmed.save(OUT / "hyams-logo.png", "PNG", optimize=True)
w, h = trimmed.size
target_h = 96
ratio = target_h / h
small = trimmed.resize((int(w * ratio), target_h), Image.LANCZOS)
small.save(OUT / "hyams-logo@1x.png", "PNG", optimize=True)

def square_pad(img, size, bg=(0, 0, 0, 0), pad_ratio=0.10):
    """Fit img into square of `size`, with padding ratio of empty border."""
    canvas = Image.new("RGBA", (size, size), bg)
    inner = int(size * (1 - 2 * pad_ratio))
    iw, ih = img.size
    scale = min(inner / iw, inner / ih)
    nw, nh = max(1, int(iw * scale)), max(1, int(ih * scale))
    resized = img.resize((nw, nh), Image.LANCZOS)
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return canvas

# square favicons - transparent bg
for size in (16, 32, 192, 512):
    square_pad(trimmed, size).save(OUT / f"icon-{size}.png", "PNG", optimize=True)

# apple-touch wants opaque, white-ish background
apple = square_pad(trimmed, 180, bg=(255, 255, 255, 255), pad_ratio=0.08).convert("RGB")
apple.save(OUT / "apple-touch-icon.png", "PNG", optimize=True)

# maskable - solid green bg, larger safe zone
for size in (192, 512):
    canvas = Image.new("RGBA", (size, size), (*GREEN_BRAND, 255))
    inner = int(size * 0.66)
    iw, ih = trimmed.size
    scale = min(inner / iw, inner / ih)
    nw, nh = max(1, int(iw * scale)), max(1, int(ih * scale))
    resized = trimmed.resize((nw, nh), Image.LANCZOS)
    # if logo is mostly dark on light, paint behind it so it stays visible on green
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    canvas.save(OUT / f"icon-maskable-{size}.png", "PNG", optimize=True)

# multi-res favicon.ico
ico_imgs = [Image.open(OUT / f"icon-{s}.png") for s in (16, 32, 48) if (OUT / f"icon-{s}.png").exists()]
if not ico_imgs:
    ico_imgs = [Image.open(OUT / "icon-32.png")]
ico_imgs[0].save(ROOT / "web_root" / "favicon.ico", format="ICO",
                 sizes=[(16, 16), (32, 32), (48, 48)])

# og-image: 1200x630, dark green bg, logo centered
og = Image.new("RGB", (1200, 630), GREEN_DARK)
inner = 460
iw, ih = trimmed.size
scale = min((1200 - 200) / iw, inner / ih)
nw, nh = int(iw * scale), int(ih * scale)
logo_for_og = trimmed.resize((nw, nh), Image.LANCZOS)
# composite with white tint behind so dark linework reads on dark green
white_card = Image.new("RGBA", (nw + 80, nh + 80), (255, 255, 255, 235))
og.paste(white_card, ((1200 - white_card.width) // 2, (630 - white_card.height) // 2), white_card)
og.paste(logo_for_og, ((1200 - nw) // 2, (630 - nh) // 2), logo_for_og)
og.save(OUT / "og-image.png", "PNG", optimize=True)

print("done")
for p in sorted(OUT.glob("*.png")):
    print(f"  {p.name}: {p.stat().st_size} bytes")
print(f"  favicon.ico: {(ROOT / 'web_root' / 'favicon.ico').stat().st_size} bytes")
