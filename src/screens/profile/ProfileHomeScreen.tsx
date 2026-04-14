import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Avatar, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore } from '../../store';
import { logout } from '../../services/authService';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export const ProfileHomeScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<Nav>();

  if (!user) return null;

  return (
    <Screen>
      <Header title="Perfil" />

      <Card style={styles.hero}>
        <Avatar name={user.name} photoURL={user.photoURL} size={88} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.role === 'superadmin' ? <Text style={styles.badge}>👑 Super admin</Text> : null}
      </Card>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        <MenuItem label="✏️  Editar meus dados" onPress={() => nav.navigate('EditProfile')} />
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

const MenuItem: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <Pressable onPress={onPress} style={styles.menuItem}>
    <Text style={styles.menuTxt}>{label}</Text>
    <Text style={styles.menuChev}>›</Text>
  </Pressable>
);

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
});
