import { create } from 'zustand';
import { colors } from '../constants/theme';

type ThemeColors = typeof colors;

interface ThemeState {
  isDark: boolean;
  colors: ThemeColors;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  colors,
  toggle: () => set((s) => ({ isDark: !s.isDark })),
}));
