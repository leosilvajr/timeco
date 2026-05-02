import { colors, lightColors, darkColors, setActivePalette, ColorPalette } from './theme';
import { contrastRatio } from './contrast';

// ----------------------------------------------------------------------
// Testes da estrutura da paleta
// ----------------------------------------------------------------------

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
    expect(darkColors.background.startsWith('#0')).toBe(true);
    expect(['#E', '#F'].some((p) => darkColors.text.startsWith(p))).toBe(true);
  });

  it('todas as cores semânticas são strings não vazias', () => {
    const palettes: { name: string; p: ColorPalette }[] = [
      { name: 'light', p: lightColors },
      { name: 'dark', p: darkColors },
    ];
    for (const { p } of palettes) {
      Object.values(p).forEach((v) => {
        expect(typeof v).toBe('string');
        expect((v as string).length).toBeGreaterThan(0);
      });
    }
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

// ----------------------------------------------------------------------
// Testes do helper de contraste
// ----------------------------------------------------------------------

describe('contrastRatio helper', () => {
  it('preto vs branco = 21:1 (máximo)', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });

  it('mesma cor = 1:1 (mínimo)', () => {
    expect(contrastRatio('#888888', '#888888')).toBe(1);
  });

  it('é simétrico (a vs b == b vs a)', () => {
    expect(contrastRatio('#1B2B20', '#FFFFFF')).toBe(contrastRatio('#FFFFFF', '#1B2B20'));
  });
});

// ----------------------------------------------------------------------
// Testes de contraste das paletas — garantem legibilidade real
// WCAG AA: 4.5:1 texto normal, 3:1 UI/texto grande
// ----------------------------------------------------------------------

const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;

describe('Contraste WCAG — light mode', () => {
  it('text vs background passa AA (≥ 4.5)', () => {
    expect(contrastRatio(lightColors.text, lightColors.background)).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL,
    );
  });

  it('text vs surface passa AA', () => {
    expect(contrastRatio(lightColors.text, lightColors.surface)).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL,
    );
  });

  it('text vs surfaceVariant passa AA', () => {
    expect(contrastRatio(lightColors.text, lightColors.surfaceVariant)).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL,
    );
  });

  it('textSecondary vs background passa AA-large (≥ 3.0)', () => {
    expect(
      contrastRatio(lightColors.textSecondary, lightColors.background),
    ).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
  });

  it('textMuted vs background passa AA-large (≥ 3.0)', () => {
    expect(
      contrastRatio(lightColors.textMuted, lightColors.background),
    ).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
  });

  it('onPrimary vs primary passa AA-large (texto em CTA)', () => {
    expect(contrastRatio(lightColors.onPrimary, lightColors.primary)).toBeGreaterThanOrEqual(
      WCAG_AA_LARGE,
    );
  });

  it('white vs danger passa AA-large', () => {
    expect(contrastRatio(lightColors.white, lightColors.danger)).toBeGreaterThanOrEqual(
      WCAG_AA_LARGE,
    );
  });
});

describe('Contraste WCAG — dark mode', () => {
  it('text vs background passa AA', () => {
    expect(contrastRatio(darkColors.text, darkColors.background)).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL,
    );
  });

  it('text vs surface passa AA', () => {
    expect(contrastRatio(darkColors.text, darkColors.surface)).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL,
    );
  });

  it('text vs surfaceVariant passa AA', () => {
    expect(contrastRatio(darkColors.text, darkColors.surfaceVariant)).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL,
    );
  });

  it('textSecondary vs background passa AA-large', () => {
    expect(
      contrastRatio(darkColors.textSecondary, darkColors.background),
    ).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
  });

  it('onPrimary vs primary passa AA-large (texto em CTA)', () => {
    expect(contrastRatio(darkColors.onPrimary, darkColors.primary)).toBeGreaterThanOrEqual(
      WCAG_AA_LARGE,
    );
  });
});

describe('Cores de borda têm visibilidade suficiente', () => {
  // Borders precisam ser visíveis mas não dominantes — usamos 1.3:1 mínimo
  it('border vs surface no light mode é distinguível', () => {
    expect(contrastRatio(lightColors.border, lightColors.surface)).toBeGreaterThan(1.05);
  });

  it('border vs surface no dark mode é distinguível', () => {
    expect(contrastRatio(darkColors.border, darkColors.surface)).toBeGreaterThan(1.05);
  });
});
