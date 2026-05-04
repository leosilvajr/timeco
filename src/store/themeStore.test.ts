// Mocks de módulos nativos antes de importar qualquer coisa do app
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((k: string) => Promise.resolve(store[k] ?? null)),
      setItem: jest.fn((k: string, v: string) => {
        store[k] = v;
        return Promise.resolve();
      }),
      removeItem: jest.fn((k: string) => {
        delete store[k];
        return Promise.resolve();
      }),
    },
  };
});

jest.mock('react-native', () => ({
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from './themeStore';
import { darkColors, lightColors, colors as proxyColors } from '../constants/theme';

describe('useThemeStore', () => {
  beforeEach(async () => {
    await AsyncStorage.removeItem('@timeco/themeMode');
    useThemeStore.setState({ mode: 'system', isDark: false, colors: lightColors });
  });

  it('estado inicial é "system"', () => {
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('setMode("dark") muda colors para darkColors', async () => {
    await useThemeStore.getState().setMode('dark');
    const s = useThemeStore.getState();
    expect(s.mode).toBe('dark');
    expect(s.isDark).toBe(true);
    expect(s.colors).toBe(darkColors);
  });

  it('setMode("light") muda colors para lightColors', async () => {
    await useThemeStore.getState().setMode('dark');
    await useThemeStore.getState().setMode('light');
    const s = useThemeStore.getState();
    expect(s.mode).toBe('light');
    expect(s.isDark).toBe(false);
    expect(s.colors).toBe(lightColors);
  });

  it('setMode persiste a preferência em AsyncStorage', async () => {
    await useThemeStore.getState().setMode('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@timeco/themeMode', 'dark');
    const stored = await AsyncStorage.getItem('@timeco/themeMode');
    expect(stored).toBe('dark');
  });

  it('hydrate lê a preferência salva e aplica', async () => {
    await AsyncStorage.setItem('@timeco/themeMode', 'dark');
    await useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().isDark).toBe(true);
  });

  it('hydrate cai em "light" (default) quando storage está vazio', async () => {
    await AsyncStorage.removeItem('@timeco/themeMode');
    await useThemeStore.getState().hydrate();
    // Default trocado pra 'light' — primeira impressão neutra ao instalar.
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('Proxy colors reflete a paleta ativa após setMode', async () => {
    await useThemeStore.getState().setMode('dark');
    expect(proxyColors.background).toBe(darkColors.background);

    await useThemeStore.getState().setMode('light');
    expect(proxyColors.background).toBe(lightColors.background);
  });
});
