import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/theme';
import { useThemedColors, useUnreadCount } from '../store';

/**
 * Sininho de notificações estilo rede social. Aparece no canto
 * superior direito das telas principais (Home, Jogos, Social, Perfil).
 *
 * - Mostra badge vermelho com contagem se há não lidas
 * - Toque navega pra tela de Notificações (dentro do Perfil stack)
 */
export const NotificationBell: React.FC = () => {
  useThemedColors();
  const unread = useUnreadCount();
  const nav = useNavigation();

  const goToNotifications = () => {
    // Cross-tab: vai pra aba Perfil → Notifications via root navigator
    (nav as unknown as { navigate: (n: string, p?: unknown) => void }).navigate(
      'Perfil',
      { screen: 'Notifications' },
    );
  };

  const styles = StyleSheet.create({
    wrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bell: {
      fontSize: 20,
      lineHeight: 22,
    },
    badge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surfaceVariant,
    },
    badgeTxt: {
      color: colors.white,
      fontSize: 10,
      fontWeight: '900',
      lineHeight: 12,
    },
  });

  return (
    <Pressable onPress={goToNotifications} style={styles.wrap} hitSlop={8}>
      <Text style={styles.bell}>🔔</Text>
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};
