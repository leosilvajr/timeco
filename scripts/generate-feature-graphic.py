"""
Gera o feature graphic (banner) 1024x500 da Play Store usando o logo
+ texto + decorações esportivas. Output: assets/_play-store/feature-graphic.png

Usa apenas Pillow (já instalado). Não exige fonts customizadas — cai
nos defaults do sistema.
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1024, 500
OUT_DIR = "assets/_play-store"
os.makedirs(OUT_DIR, exist_ok=True)
LOGO = "assets/logo.png"
OUT = f"{OUT_DIR}/feature-graphic.png"

# Cores Timeco
PRIMARY = (15, 157, 88)         # #0F9D58
PRIMARY_DARK = (11, 122, 67)    # #0B7A43
PRIMARY_LIGHT = (52, 199, 123)  # #34C77B
WHITE = (255, 255, 255)
TEXT_DARK = (27, 43, 32)        # #1B2B20


def find_font(size: int) -> ImageFont.FreeTypeFont:
    """Tenta usar Arial Bold, Helvetica Bold, ou cai no default."""
    candidates = [
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVu-Sans-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def vertical_gradient(width: int, height: int, top: tuple, bottom: tuple) -> Image.Image:
    """Cria um gradiente vertical do top pro bottom."""
    grad = Image.new("RGB", (width, height), top)
    pixels = grad.load()
    for y in range(height):
        t = y / max(height - 1, 1)
        r = int(top[0] * (1 - t) + bottom[0] * t)
        g = int(top[1] * (1 - t) + bottom[1] * t)
        b = int(top[2] * (1 - t) + bottom[2] * t)
        for x in range(width):
            pixels[x, y] = (r, g, b)
    return grad


def main():
    print(f"Lendo logo: {LOGO}")
    logo = Image.open(LOGO).convert("RGBA")
    print(f"  Logo dim: {logo.size}")

    # 1. Background gradiente verde
    bg = vertical_gradient(W, H, PRIMARY, PRIMARY_DARK).convert("RGBA")

    # 2. Decorações geométricas sutis (círculos brancos com baixa opacidade)
    draw = ImageDraw.Draw(bg, "RGBA")
    decor_circles = [
        (40, 40, 80, 0.10),       # canto superior esquerdo
        (W - 120, 60, 100, 0.08), # canto superior direito
        (W - 80, H - 100, 60, 0.10),
        (W - 200, H - 70, 40, 0.07),
        (50, H - 120, 55, 0.08),
    ]
    for x, y, size, alpha in decor_circles:
        draw.ellipse(
            [x, y, x + size, y + size],
            fill=(255, 255, 255, int(255 * alpha)),
        )

    # 3. Logo grande à esquerda (em uma "bolha branca" como nos cards do app)
    logo_target_h = 320
    aspect = logo.size[0] / logo.size[1]
    logo_resized = logo.resize((int(logo_target_h * aspect), logo_target_h), Image.LANCZOS)

    # Bolha branca circular de fundo
    bubble_size = 360
    bubble_x = 80
    bubble_y = (H - bubble_size) // 2
    bubble = Image.new("RGBA", (bubble_size, bubble_size), (0, 0, 0, 0))
    bubble_draw = ImageDraw.Draw(bubble)
    bubble_draw.ellipse([0, 0, bubble_size, bubble_size], fill=WHITE)
    bg.paste(bubble, (bubble_x, bubble_y), bubble)

    # Centraliza o logo dentro da bolha
    logo_x = bubble_x + (bubble_size - logo_resized.size[0]) // 2
    logo_y = bubble_y + (bubble_size - logo_resized.size[1]) // 2
    bg.paste(logo_resized, (logo_x, logo_y), logo_resized)

    # 4. Texto "Timeco" + tagline à direita
    title_font = find_font(96)
    tagline_font = find_font(34)
    sub_font = find_font(24)

    text_x = bubble_x + bubble_size + 60
    title_y = 120

    # Title
    draw.text((text_x, title_y), "Timeco", font=title_font, fill=WHITE)

    # Tagline
    draw.text((text_x, title_y + 120), "Times equilibrados", font=tagline_font, fill=WHITE)
    draw.text((text_x, title_y + 165), "em segundos", font=tagline_font, fill=WHITE)

    # Sub
    draw.text(
        (text_x, title_y + 230),
        "Pelada · Vôlei · Basquete · e mais",
        font=sub_font,
        fill=(255, 255, 255, 220),
    )

    # 5. Salva
    final = bg.convert("RGB")  # PNG sem transparência (Play Store exige)
    final.save(OUT, "PNG", optimize=True)
    print(f"\nDone! {OUT} ({W}x{H})")


if __name__ == "__main__":
    main()
