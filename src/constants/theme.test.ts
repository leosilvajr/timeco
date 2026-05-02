import { colors, lightColors, darkColors, setActivePalette } from './theme';

describe('Color palettes', () => {
  it('lightColors e darkColors têm todas as chaves obrigatórias', () => {
    const required = [
      'primary', 'background', 'surface', 'text', 'textSecondary',
      'border', 'danger', 'success', 'warning', 'info',
    ];
    for (const key of required) {
      expect(lightColors).toHaveProperty(key);
      expect(darkColors).toHaveProperty(key);
      expect((lightColors as unknown as Record<string, string>)[key]).toMatch(/^#|^rgb|transparent/);
      expect((darkColors as unknown as Record<string, string>)[key]).toMatch(/^#|^rgb|transparent/);
    }
  });

  it('background light e dark são diferentes (contraste)', () => {
    expect(lightColors.background).not.toBe(darkColors.background);
    expect(lightColors.text).not.toBe(darkColors.text);
  });

  it('dark mode tem fundo escuro e texto claro', () => {
    // background começa com #0 (preto-escuro) em dark
    expect(darkColors.background.startsWith('#0')).toBe(true);
    // text começa com #E ou similar (claro) em dark
    expect(['#E', '#F'].some((p) => darkColors.text.startsWith(p))).toBe(true);
  });
});

describe('colors Proxy', () => {
  afterEach(() => {
    setActivePalette(lightColors);
  });

  it('retorna valores da paleta ativa em tempo real', () => {
    setActivePalette(lightColors);
    expect(colors.background).toBe(lightColors.background);

    setActivePalette(darkColors);
    expect(colors.background).toBe(darkColors.background);
  });

  it('alternar paleta reflete imediatamente em todos os campos', () => {
    setActivePalette(darkColors);
    expect(colors.text).toBe(darkColors.text);
    expect(colors.surface).toBe(darkColors.surface);

    setActivePalette(lightColors);
    expect(colors.text).toBe(lightColors.text);
    expect(colors.surface).toBe(lightColors.surface);
  });
});
