import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore, ToastType } from '../store/toastStore';
import { useThemedColors } from '../store';
import { ColorPalette } from '../constants/theme';

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const colorsFor = (
  type: ToastType,
  c: ColorPalette,
): { bg: string; fg: string; border: string } => {
  switch (type) {
    case 'success':
      return { bg: c.success, fg: c.white, border: c.success };
    case 'error':
      return { bg: c.danger, fg: c.white, border: c.danger };
    case 'warning':
      return { bg: c.warning, fg: c.black, border: c.warning };
    case 'info':
    default:
      return { bg: c.surface, fg: c.text, border: c.border };
  }
};

/**
 * Container nativo de toasts. Empilha no rodape acima da safe area.
 * Renderizar uma vez no App raiz dentro do SafeAreaProvider.
 */
export const ToastContainer: React.FC = () => {
  const c = useThemedColors();
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + 16 }]}
    >
      {toasts.map((t) => {
        const palette = colorsFor(t.type, c);
        return (
          <View
            key={t.id}
            style={[
              styles.toast,
              {
                backgroundColor: palette.bg,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={styles.icon}>{ICONS[t.type]}</Text>
            <Text style={[styles.msg, { color: palette.fg }]}>{t.message}</Text>
            {t.action ? (
              <Pressable
                onPress={() => {
                  t.action?.onPress();
                  dismiss(t.id);
                }}
                hitSlop={8}
              >
                <Text style={[styles.actionTxt, { color: palette.fg }]}>
                  {t.action.label}
                </Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => dismiss(t.id)} hitSlop={10}>
              <Text style={[styles.close, { color: palette.fg }]}>×</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 99999,
    elevation: 99,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  icon: { fontSize: 18, flexShrink: 0 },
  msg: { flex: 1, fontSize: 14, fontWeight: '600' },
  actionTxt: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
    marginRight: 4,
  },
  close: { fontSize: 22, fontWeight: '700', opacity: 0.7, paddingHorizontal: 4 },
});
