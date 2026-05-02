/**
 * Helpers de contraste WCAG 2.1.
 * Usado em testes pra garantir legibilidade da paleta.
 */

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
};

const linearize = (c: number): number => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

export const luminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
};

/**
 * Razão de contraste WCAG entre duas cores.
 * Retorna valor entre 1 (mesma cor) e 21 (preto vs branco).
 *
 * Thresholds:
 * - 4.5+: WCAG AA texto normal
 * - 3.0+: WCAG AA texto grande / componentes UI
 */
export const contrastRatio = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};
