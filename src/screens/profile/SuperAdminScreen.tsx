import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Avatar, Input, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { getAllUsers } from '../../services/userService';
import { setUserRole } from '../../services/authService';
import { useAuthStore } from '../../store';
import { User, UserRole } from '../../types';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'SuperAdmin'>;

export const SuperAdminScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const current = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const list = await getAllUsers();
    setUsers(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (current?.role !== 'superadmin') {
    return (
      <Screen>
        <Header title="Super admin" onBack={() => nav.goBack()} />
        <Text style={{ color: colors.danger, textAlign: 'center' }}>
          Acesso negado. Somente super admins podem acessar.
        </Text>
      </Screen>
    );
  }

  const onToggleRole = async (u: User) => {
    setBusy((s) => new Set(s).add(u.id));
    try {
      const next: UserRole = u.role === 'superadmin' ? 'user' : 'superadmin';
      await setUserRole(u.id, next);
      await load();
    } finally {
      setBusy((s) => {
        const n = new Set(s);
        n.delete(u.id);
        return n;
      });
    }
  };

  const filtered = q.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(q.toLowerCase()) ||
          u.email.toLowerCase().includes(q.toLowerCase())
      )
    : users;

  return (
    <Screen>
      <Header title="Super admin" subtitle={`${users.length} usuários`} onBack={() => nav.goBack()} />

      <Input label="Buscar" value={q} onChangeText={setQ} placeholder="Nome ou email" autoCapitalize="none" />

      {filtered.map((u) => (
        <Card key={u.id} style={styles.row}>
          <Avatar name={u.name} photoURL={u.photoURL} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {u.name}
              {u.role === 'superadmin' ? ' 👑' : ''}
            </Text>
            <Text style={styles.email}>{u.email}</Text>
          </View>
          {u.id !== current.id ? (
            <Button
              title={u.role === 'superadmin' ? 'Tirar admin' : 'Tornar admin'}
              variant="outline"
              onPress={() => onToggleRole(u)}
              loading={busy.has(u.id)}
              fullWidth={false}
              style={{ minHeight: 38, paddingHorizontal: 12 }}
              textStyle={{ fontSize: 12 }}
            />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
