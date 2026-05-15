import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader, HtmlCard, HtmlEmpty, webConfirm } from '../../components/web';
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
    const ok = await webConfirm({
      title: 'Desbloquear',
      message: `Desbloquear ${b.blockedUserName || 'este usuário'}?`,
      confirmLabel: 'Desbloquear',
    });
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
    <HtmlScreen maxWidth={600}>
      <HtmlHeader
        title="Usuários bloqueados"
        subtitle={`${blocked.length} ${blocked.length === 1 ? 'usuário' : 'usuários'}`}
        onBack={() => nav.goBack()}
      />

      {loading ? (
        <p style={{ color: c.textMuted, textAlign: 'center' }}>Carregando...</p>
      ) : blocked.length === 0 ? (
        <HtmlEmpty
          emoji="🚫"
          title="Nenhum usuário bloqueado"
          subtitle="Quando você bloquear alguém, ele aparecerá aqui pra você desbloquear se quiser."
        />
      ) : (
        blocked.map((b) => (
          <HtmlCard key={b.blockedUserId}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>🚫</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
                  {b.blockedUserName || b.blockedUserId.slice(0, 8) + '...'}
                </div>
                <div style={{ fontSize: 11, color: c.textMuted }}>
                  Você não vê mensagens, perfil ou fotos desse usuário.
                </div>
              </div>
              <button
                onClick={() => onUnblock(b)}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: `1px solid ${c.border}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.primary,
                }}
              >
                Desbloquear
              </button>
            </div>
          </HtmlCard>
        ))
      )}
    </HtmlScreen>
  );
};
