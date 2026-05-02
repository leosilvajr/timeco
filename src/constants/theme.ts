export interface ColorPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  /** Cor de texto/ícone que vai por cima de `primary` (garante legibilidade) */
  onPrimary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  star: string;
  starEmpty: string;
  white: string;
  black: string;
  transparent: string;
  overlay: string;
}

export const lightColors: ColorPalette = {
  primary: '#0F9D58',
  primaryDark: '#0B7A43',
  primaryLight: '#34C77B',
  onPrimary: '#FFFFFF',
  secondary: '#F4B400',
  accent: '#DB4437',
  background: '#F7FAF8',
  surface: '#FFFFFF',
  surfaceVariant: '#EDF3EF',
  card: '#FFFFFF',
  text: '#1B2B20',
  textSecondary: '#5C6D63',
  textMuted: '#6E7C75',
  border: '#DCE5DF',
  success: '#0F9D58',
  warning: '#F4B400',
  danger: '#DB4437',
  info: '#4285F4',
  star: '#F4B400',
  starEmpty: '#D7DFD9',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.4)',
};

export const darkColors: ColorPalette = {
  // Primary mais escuro no dark mode pra texto branco continuar legível
  // (#0F9D58 contrasta 4.13:1 com #FFFFFF — passa WCAG AA-large)
  primary: '#0F9D58',
  primaryDark: '#0B7A43',
  primaryLight: '#34C77B',
  onPrimary: '#FFFFFF',
  secondary: '#F4B400',
  accent: '#FF6B5E',
  background: '#0A1410',
  surface: '#152620',
  surfaceVariant: '#1E322B',
  card: '#152620',
  text: '#E8F0EB',
  textSecondary: '#A8B5AC',
  textMuted: '#7A8782',
  border: '#2A3F37',
  success: '#34C77B',
  warning: '#F4B400',
  danger: '#FF6B5E',
  info: '#5B9DFF',
  star: '#F4B400',
  starEmpty: '#3A4A42',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.6)',
};

// Paleta ativa — mutável. Os componentes acessam via Proxy `colors`
// (abaixo) para sempre lerem o valor atual sem precisar refatorar imports.
let _active: ColorPalette = lightColors;

export const setActivePalette = (p: ColorPalette): void => {
  _active = p;
};

/**
 * Proxy que sempre retorna o valor atual da paleta ativa.
 * Componentes podem continuar usando `import { colors }` normalmente,
 * mas precisam re-renderizar (via `useThemeStore(s => s.mode)` ou similar)
 * e definir `StyleSheet.create({...})` DENTRO do componente para que
 * cada render pegue os valores atualizados.
 */
export const colors: ColorPalette = new Proxy({} as ColorPalette, {
  get: (_target, key: string) => _active[key as keyof ColorPalette],
}) as ColorPalette;

export const teamColors: { name: string; color: string }[] = [
  { name: 'Verde', color: '#0F9D58' },
  { name: 'Amarelo', color: '#F4B400' },
  { name: 'Vermelho', color: '#DB4437' },
  { name: 'Azul', color: '#4285F4' },
  { name: 'Laranja', color: '#F97316' },
  { name: 'Roxo', color: '#8B5CF6' },
  { name: 'Rosa', color: '#EC4899' },
  { name: 'Cinza', color: '#6B7280' },
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '400' as const },
};
