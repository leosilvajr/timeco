export { useAuthStore } from './authStore';
export { useThemeStore } from './themeStore';
export type { ThemeMode } from './themeStore';

import { useThemeStore } from './themeStore';

/**
 * Helper hook: subscreve a mudanças de tema e devolve a paleta atual.
 * Use dentro do componente; os styles devem ser criados após este hook
 * (idealmente via StyleSheet.create dentro do corpo do componente, ou useMemo
 * com `colors` como dep) para que dark/light alternem ao vivo.
 */
export const useThemedColors = () => useThemeStore((s) => s.colors);
