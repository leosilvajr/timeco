import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Avatar, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors, useThemeStore, useUnreadCount } from '../../store';
import { computeProfileCompletion } from '../../hooks/useProfileCompletion';
import { logout } from '../../services/authService';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export const ProfileHomeScreen: React.FC = () => {
  useThemedColors();
  const user = useAuthStore((s) => s.user);
  const mode = useThemeStore((s) => s.mode);
  const unread = useUnreadCount();
  const completion = computeProfileCompletion(user);
  const nav = useNavigation<Nav>();

  if (!user) return null;

  const themeLabel = mode === 'system' ? 'Sistema' : mode === 'dark' ? 'Escuro' : 'Claro';

  const styles = StyleSheet.create({
    hero: {
      alignItems: 'center',
      gap: 4,
    },
    name: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginTop: 6,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    badge: {
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: colors.secondary,
      color: colors.black,
      fontWeight: '800',
      borderRadius: radius.pill,
      fontSize: 12,
    },
    menuItem: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    menuTxt: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
    },
    menuRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    menuValue: {
      fontSize: 13,
      color: colors.textMuted,
    },
    menuBadge: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      borderRadius: 11,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuBadgeTxt: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '800',
    },
    menuChev: {
      fontSize: 22,
      color: colors.textMuted,
    },
    footer: {
      marginTop: spacing.xxl,
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 12,
    },
    completionBox: {
      width: '100%',
      marginTop: spacing.md,
    },
    completionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
      textAlign: 'center',
    },
    completionTrack: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    completionFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
  });

  const MenuItem: React.FC<{
    label: string;
    value?: string;
    badge?: number;
    onPress: () => void;
  }> = ({ label, value, badge, onPress }) => (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Text style={styles.menuTxt}>{label}</Text>
      <View style={styles.menuRight}>
        {badge && badge > 0 ? (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeTxt}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : value ? (
          <Text style={styles.menuValue}>{value}</Text>
        ) : null}
        <Text style={styles.menuChev}>›</Text>
      </View>
    </Pressable>
  );

  return (
    <Screen maxWidth={600}>
      <Header title="Perfil" />

      <Card style={styles.hero}>
        <Avatar name={user.name} photoURL={user.photoURL} size={88} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.role === 'superadmin' ? <Text style={styles.badge}>👑 Super admin</Text> : null}
        <View style={styles.completionBox}>
          <Text style={styles.completionLabel}>
            Cadastro {completion.percent}% completo
            {completion.isComplete ? ' ✅' : ''}
          </Text>
          <View style={styles.completionTrack}>
            <View style={[styles.completionFill, { width: `${completion.percent}%` }]} />
          </View>
        </View>
      </Card>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        <MenuItem
          label="🔔  Notificações"
          badge={unread}
          onPress={() => nav.navigate('Notifications')}
        />
        <MenuItem label="✏️  Editar meus dados" onPress={() => nav.navigate('EditProfile')} />
        <MenuItem
          label="🎨  Aparência"
          value={themeLabel}
          onPress={() => nav.navigate('ThemeSettings')}
        />
        {user.role === 'superadmin' ? (
          <MenuItem label="🛡️  Painel super admin" onPress={() => nav.navigate('SuperAdmin')} />
        ) : null}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Sair" variant="outline" onPress={() => logout()} />
      </View>

      <Text style={styles.footer}>Timeco v1.0.0</Text>
    </Screen>
  );
};
