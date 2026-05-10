// Imports CSS do Mantine — so funcionam no web (Metro bundle export).
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import React from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { AppShell } from './src/AppShell';
import { useThemeStore } from './src/store';

/**
 * Tema do Mantine usando paleta primary do Timeco (verde).
 * Mantine usa escala 0-9 — geramos 10 tons aproximados do verde primario.
 */
const TIMECO_GREEN: [string, string, string, string, string, string, string, string, string, string] = [
  '#E6F4EC', // 0 — bem claro
  '#C8E6D4', // 1
  '#A0D4B5', // 2
  '#74C194', // 3
  '#52B379', // 4
  '#34C77B', // 5 — primaryLight
  '#0F9D58', // 6 — primary (default)
  '#0B7A43', // 7 — primaryDark
  '#075F33', // 8
  '#054C28', // 9 — bem escuro
];

const theme = createTheme({
  primaryColor: 'timeco',
  colors: {
    timeco: TIMECO_GREEN,
  },
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
});

/** Entry point web. Envolve AppShell com MantineProvider, ModalsProvider e Notifications. */
export default function App() {
  const isDark = useThemeStore((s) => s.isDark);
  return (
    <MantineProvider theme={theme} defaultColorScheme={isDark ? 'dark' : 'light'}>
      <Notifications position="top-right" zIndex={99999} />
      <ModalsProvider>
        <AppShell />
      </ModalsProvider>
    </MantineProvider>
  );
}
