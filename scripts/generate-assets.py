"""
Gera todos os assets do app Timeco a partir da imagem composite original
do Gemini. Produz:

- assets/icon.png (1024x1024) — ícone Expo principal
- assets/adaptive-icon.png (1024x1024) — Android adaptive (foreground)
- assets/splash-icon.png (1024x1024) — splash screen
- assets/favicon.png (48x48) — web favicon
- assets/logo.png (logo cortado, alta resolução, fundo transparente)
- assets/logo-square.png (logo cortado e centralizado em quadrado)
- assets/_play-store/icon-512.png — ícone alta resolução pra Play Store

A imagem composite tem o layout:
- Esquerda: wordmark TIMECO + variações pequenas
- Direita: logo principal grande (T estilizado com pessoas correndo + bola)

Cortamos a região direita e usamos como base.
"""
from PIL import Image
import os

SRC = "assets/_source/Gemini_Generated_Image_eeija0eeija0eeij.png"
OUT = "assets"

# Bbox do logo principal no composite (validado visualmente)
LOGO_BBOX = (774, 38, 1388, 748)

# Cor de fundo do brand (verde primary do app)
BRAND_GREEN = (15, 157, 88, 255)  # #0F9D58
# Fundo branco — logo é verde, então fica melhor em fundo claro
WHITE_BG = (255, 255, 255, 255)


def trim_whitespace(img: Image.Image, threshold: int = 240) -> Image.Image:
    """Remove margens brancas/transparentes ao redor do logo."""
    rgba = img.convert("RGBA")
    bbox = None
    pixels = rgba.load()
    w, h = rgba.size

    # Encontra bbox onde tem pixel com cor (não branco e não transparente)
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            is_white = r > threshold and g > threshold and b > threshold
            is_transparent = a < 10
            if not is_white and not is_transparent:
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y
    if max_x > min_x and max_y > min_y:
        bbox = (min_x, min_y, max_x + 1, max_y + 1)
        return rgba.crop(bbox)
    return rgba


def to_transparent(img: Image.Image, threshold: int = 235) -> Image.Image:
    """Torna pixels brancos/quase-brancos transparentes."""
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r > threshold and g > threshold and b > threshold:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def square_canvas(img: Image.Image, size: int, bg: tuple, padding_pct: float = 0.12) -> Image.Image:
    """
    Centraliza a imagem num canvas quadrado com padding em volta.
    bg: cor de fundo (4-tuple). Use (0,0,0,0) para transparente.
    """
    canvas = Image.new("RGBA", (size, size), bg)
    available = int(size * (1 - 2 * padding_pct))

    # Reescala mantendo proporção
    w, h = img.size
    scale = min(available / w, available / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = img.resize((nw, nh), Image.LANCZOS)
    paste_x = (size - nw) // 2
    paste_y = (size - nh) // 2
    canvas.paste(resized, (paste_x, paste_y), resized)
    return canvas


def main():
    print(f"Lendo composite: {SRC}")
    composite = Image.open(SRC).convert("RGBA")
    print(f"  Dimensões: {composite.size}")

    # 1. Corta o logo principal
    raw_logo = composite.crop(LOGO_BBOX)
    print(f"Logo bruto: {raw_logo.size}")

    # 2. Torna fundo branco transparente
    logo_t = to_transparent(raw_logo)

    # 3. Recorta margens vazias
    logo_clean = trim_whitespace(logo_t)
    print(f"Logo limpo: {logo_clean.size}")

    # Salva versões base
    logo_clean.save(f"{OUT}/logo.png")
    print(f"OK {OUT}/logo.png ({logo_clean.size})")

    # 4. Versão quadrada com fundo transparente (pra usar em layouts variados)
    logo_square = square_canvas(logo_clean, 1024, (0, 0, 0, 0), padding_pct=0.10)
    logo_square.save(f"{OUT}/logo-square.png")
    print(f"OK {OUT}/logo-square.png (1024x1024 transparente)")

    # 5. icon.png — ícone principal Expo (1024x1024 fundo branco)
    # O logo já é verde, fundo branco dá melhor contraste e legibilidade
    # como ícone na home do celular.
    icon = square_canvas(logo_clean, 1024, WHITE_BG, padding_pct=0.10)
    icon.save(f"{OUT}/icon.png")
    print(f"OK {OUT}/icon.png (1024x1024 fundo branco)")

    # 6. adaptive-icon.png — Android adaptive icon (foreground)
    # Android: o foreground precisa ter padding extra (~33%) porque o
    # launcher pode mascarar como círculo, square arredondado, etc.
    # background é setado via app.json (BRAND_GREEN).
    adaptive = square_canvas(logo_clean, 1024, (0, 0, 0, 0), padding_pct=0.25)
    adaptive.save(f"{OUT}/adaptive-icon.png")
    print(f"OK {OUT}/adaptive-icon.png (1024x1024 transparente, padding 25%)")

    # 7. splash-icon.png — Splash screen (logo grande, centralizado)
    splash = square_canvas(logo_clean, 1024, (0, 0, 0, 0), padding_pct=0.22)
    splash.save(f"{OUT}/splash-icon.png")
    print(f"OK {OUT}/splash-icon.png (1024x1024 transparente)")

    # 8. favicon.png — Web favicon
    favicon = square_canvas(logo_clean, 48, (0, 0, 0, 0), padding_pct=0.05)
    favicon.save(f"{OUT}/favicon.png")
    print(f"OK {OUT}/favicon.png (48x48)")

    # 9. Versões extras pra Play Store / web
    play_dir = f"{OUT}/_play-store"
    os.makedirs(play_dir, exist_ok=True)
    # Play Store ícone alta resolução: 512x512
    play_icon = square_canvas(logo_clean, 512, WHITE_BG, padding_pct=0.10)
    play_icon.save(f"{play_dir}/icon-512.png")
    print(f"OK {play_dir}/icon-512.png (Play Store, fundo branco)")

    # 10. Favicon variantes (ICO seria ideal mas Expo aceita PNG)
    favicon_192 = square_canvas(logo_clean, 192, (0, 0, 0, 0), padding_pct=0.05)
    favicon_192.save(f"{OUT}/favicon-192.png")
    print(f"OK {OUT}/favicon-192.png")

    favicon_512 = square_canvas(logo_clean, 512, (0, 0, 0, 0), padding_pct=0.05)
    favicon_512.save(f"{OUT}/favicon-512.png")
    print(f"OK {OUT}/favicon-512.png")

    print("\nDone! Todos os assets gerados com sucesso.")


if __name__ == "__main__":
    main()
