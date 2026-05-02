import React, { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigator } from './src/navigation';
import { onAuthStateChanged, ensureUserDocument } from './src/services/authService';
import { subscribeNotifications } from './src/services/notificationService';
import { requestWebNotificationPermission, showWebNotification } from './src/services/webPush';
import {
  useAuthStore,
  useThemeStore,
  useThemedColors,
  useNotificationStore,
} from './src/store';
import { User } from './src/types';

export default function App() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const isDark = useThemeStore((s) => s.isDark);
  const colors = useThemedColors();
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const markSeen = useNotificationStore((s) => s.markSeen);
  const resetNotifications = useNotificationStore((s) => s.reset);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  // Re-injeta o CSS de autofill toda vez que o tema mudar (cores acompanham
  // light/dark dinamicamente).
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const id = 'timeco-autofill-fix';
      let style = document.getElementById(id) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = id;
        document.head.appendChild(style);
      }
      style.textContent = `
        html, body { background-color: ${colors.background}; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px ${colors.surface} inset !important;
          -webkit-text-fill-color: ${colors.text} !important;
          caret-color: ${colors.primary} !important;
        }
        * { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      `;
    }
  }, [colors]);

  useEffect(() => {
    const unsub = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await ensureUserDocument(firebaseUser);
          setUser(userDoc as User);
        } catch (e) {
          console.error('load user', e);
          setUser(null);
        }
      } else {
        setUser(null);
        resetNotifications();
      }
      setLoading(false);
    });
    return () => unsub();
  }, [setUser, setLoading, resetNotifications]);

  // Subscription global de notificações + permissão de web push.
  useEffect(() => {
    if (!user) return;
    requestWebNotificationPermission();

    let firstBatch = true;
    const unsub = subscribeNotifications(user.id, (list) => {
      // No primeiro snapshot, marca todas como já vistas para não disparar
      // push de notificações antigas. Em snapshots seguintes, dispara push
      // só pra IDs novos não lidos.
      const seen = useNotificationStore.getState().seenIds;
      if (firstBatch) {
        firstBatch = false;
        markSeen(list.map((n) => n.id));
      } else {
        for (const n of list) {
          if (!seen.has(n.id) && !n.read) {
            showWebNotification(n);
          }
        }
        markSeen(list.map((n) => n.id));
      }
      setNotifications(list);
    });
    return () => unsub();
  }, [user, setNotifications, markSeen]);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.secondary,
    },
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <AppNavigator />
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
