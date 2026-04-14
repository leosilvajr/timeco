export const colors = {
  primary: '#0F9D58',
  primaryDark: '#0B7A43',
  primaryLight: '#34C77B',
  secondary: '#F4B400',
  accent: '#DB4437',
  background: '#F7FAF8',
  surface: '#FFFFFF',
  surfaceVariant: '#EDF3EF',
  card: '#FFFFFF',
  text: '#1B2B20',
  textSecondary: '#5C6D63',
  textMuted: '#8A9990',
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
