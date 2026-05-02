import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ColorPalette,
  darkColors,
  lightColors,
  setActivePalette,
} from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = '@timeco/themeMode';

const resolveColors = (mode: ThemeMode): ColorPalette => {
  if (mode === 'light') return lightColors;
  if (mode === 'dark') return darkColors;
  return Appearance.getColorScheme() === 'dark' ? darkColors : lightColors;
};

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorPalette;
  setMode: (m: ThemeMode) => Promise<void>;
  /** Inicializa o store lendo a preferência persistida. Chamar uma vez no boot. */
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  isDark: resolveColors('system') === darkColors,
  colors: resolveColors('system'),

  setMode: async (mode) => {
    const palette = resolveColors(mode);
    setActivePalette(palette);
    set({ mode, colors: palette, isDark: palette === darkColors });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignora falha de persistência (storage cheio, etc.)
    }
  },

  hydrate: async () => {
    try {
      const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemeMode | null;
      const mode: ThemeMode = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
      const palette = resolveColors(mode);
      setActivePalette(palette);
      set({ mode, colors: palette, isDark: palette === darkColors });
    } catch {
      // fallback: deixa default
    }

    // Se modo é "system", reage a mudanças no esquema do SO.
    Appearance.addChangeListener(() => {
      if (get().mode === 'system') {
        const palette = resolveColors('system');
        setActivePalette(palette);
        set({ colors: palette, isDark: palette === darkColors });
      }
    });
  },
}));

// Garante que a paleta inicial está sincronizada com o Proxy do theme.ts
setActivePalette(resolveColors('system'));
