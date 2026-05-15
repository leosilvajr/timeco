import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, EmptyState } from '../../components';
import { useAuthStore, useThemedColors } from '../../store';
import { listBlockedUsers, unblockUser } from '../../services/blockService';
import { BlockedUser } from '../../types';
import { toast } from '../../store/toastStore';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'BlockedUsers'>;

export const BlockedUsersScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const me = useAuthStore((s) => s.user);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      setBlocked(await listBlockedUsers(me.id));
    } catch (e) {
      console.error('listBlockedUsers', e);
      toast.error('Erro ao carregar lista.');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    load();
  }, [load]);

  const onUnblock = async (b: BlockedUser) => {
    if (!me) return;
    const ok =
      typeof window !== 'undefined'
        ? window.confirm(`Desbloquear ${b.blockedUserName || 'este usuário'}?`)
        : true;
    if (!ok) return;
    try {
      await unblockUser(me.id, b.blockedUserId);
      setBlocked((prev) => prev.filter((x) => x.blockedUserId !== b.blockedUserId));
      toast.success('Desbloqueado.');
    } catch (e) {
      console.error('unblockUser', e);
      toast.error('Não conseguimos desbloquear.');
    }
  };

  return (
    <Screen>
      <Header
        title="Usuários bloqueados"
        subtitle={`${blocked.length} ${blocked.length === 1 ? 'usuário' : 'usuários'}`}
        onBack={() => nav.goBack()}
      />

      {loading ? (
        <Text style={{ color: c.textMuted, textAlign: 'center', padding: 16 }}>
          Carregando...
        </Text>
      ) : blocked.length === 0 ? (
        <EmptyState
          emoji="🚫"
          title="Nenhum usuário bloqueado"
          description="Quando você bloquear alguém, ele aparecerá aqui pra você desbloquear se quiser."
        />
      ) : (
        blocked.map((b) => (
          <Card key={b.blockedUserId}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 22 }}>🚫</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>
                  {b.blockedUserName || b.blockedUserId.slice(0, 8) + '...'}
                </Text>
                <Text style={{ fontSize: 11, color: c.textMuted }}>
                  Você não vê mensagens, perfil ou fotos desse usuário.
                </Text>
              </View>
              <Pressable
                onPress={() => onUnblock(b)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.primary }}>
                  Desbloquear
                </Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
};
