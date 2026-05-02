import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, radius } from '../constants/theme';
import { useThemedColors, useUnreadCount } from '../store';

const ICONS: Record<string, string> = {
  Inicio: '🏠',
  Jogos: '🏟️',
  Social: '👥',
  Perfil: '👤',
};

export const DesktopSidebar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  useThemedColors();
  const unread = useUnreadCount();

  const styles = StyleSheet.create({
    sidebar: {
      width: 240,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      gap: 4,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      marginBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    brandEmoji: { fontSize: 26 },
    brandText: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.primary,
      letterSpacing: -0.3,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
    },
    itemActive: {
      backgroundColor: colors.surfaceVariant,
    },
    itemIcon: {
      fontSize: 22,
      width: 26,
      textAlign: 'center',
    },
    itemLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    itemLabelActive: {
      fontWeight: '800',
      color: colors.primary,
    },
    badge: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      borderRadius: 11,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeTxt: {
      color: colors.white,
      fontSize: 11,
      fontWeight: '800',
    },
  });

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <Text style={styles.brandEmoji}>⚽</Text>
        <Text style={styles.brandText}>Timeco</Text>
      </View>

      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label =
          (options.title as string) ??
          (route.name === 'Inicio' ? 'Início' : route.name);
        const icon = ICONS[route.name] ?? '·';
        const showBadge = route.name === 'Perfil' && unread > 0;
        const badgeText = unread > 99 ? '99+' : String(unread);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[styles.item, focused && styles.itemActive]}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
          >
            <Text style={styles.itemIcon}>{icon}</Text>
            <Text style={[styles.itemLabel, focused && styles.itemLabelActive]}>
              {label}
            </Text>
            {showBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>{badgeText}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};
