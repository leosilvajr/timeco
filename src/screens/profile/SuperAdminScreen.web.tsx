import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlAvatar,
  HtmlInput,
  HtmlButton,
} from '../../components/web';
import { getAllUsers } from '../../services/userService';
import { setUserRole } from '../../services/authService';
import { useAuthStore, useThemedColors } from '../../store';
import { User, UserRole } from '../../types';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'SuperAdmin'>;

export const SuperAdminScreen: React.FC = () => {
  const c = useThemedColors();
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
      <HtmlScreen>
        <HtmlHeader title="Super admin" onBack={() => nav.goBack()} />
        <p style={{ color: c.danger, textAlign: 'center' }}>
          Acesso negado. Somente super admins podem acessar.
        </p>
      </HtmlScreen>
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
          u.email.toLowerCase().includes(q.toLowerCase()),
      )
    : users;

  return (
    <HtmlScreen maxWidth={840}>
      <HtmlHeader
        title="Super admin"
        subtitle={`${users.length} usuários`}
        onBack={() => nav.goBack()}
      />

      <div style={{ marginBottom: 12 }}>
        <HtmlButton
          title="🚩 Denúncias de usuários e conteúdo"
          variant="secondary"
          onClick={() => nav.navigate('ReportsAdmin')}
        />
      </div>

      <HtmlInput label="Buscar" value={q} onChange={setQ} placeholder="Nome ou email" />

      {filtered.map((u) => (
        <HtmlCard key={u.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HtmlAvatar name={u.name} photoURL={u.photoURL} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
                {u.name}
                {u.role === 'superadmin' ? ' 👑' : ''}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: c.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {u.email}
              </div>
            </div>
            {u.id !== current.id ? (
              <HtmlButton
                title={u.role === 'superadmin' ? 'Tirar admin' : 'Tornar admin'}
                variant="outline"
                onClick={() => onToggleRole(u)}
                loading={busy.has(u.id)}
                fullWidth={false}
                style={{ minHeight: 38, padding: '0 12px', fontSize: 12 }}
              />
            ) : null}
          </div>
        </HtmlCard>
      ))}
    </HtmlScreen>
  );
};
