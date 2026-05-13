import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlButton,
  HtmlEmpty,
  webConfirm,
} from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import { listUserVolleyTeams, deleteVolleyTeam } from '../../services/volleyTeamService';
import { VolleyTeam } from '../../types';
import { toast } from '../../store/toastStore';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyTeamsList'>;

export const VolleyTeamsListScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [teams, setTeams] = useState<VolleyTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await listUserVolleyTeams(user.id);
      setTeams(list);
    } catch (e) {
      console.error('listUserVolleyTeams', e);
      toast.error('Erro ao carregar times. Tente recarregar a página.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onDelete = async (team: VolleyTeam) => {
    const proceed = await webConfirm({
      title: 'Excluir time',
      message: `Excluir o time "${team.name}"?`,
      danger: true,
      confirmLabel: 'Excluir',
    });
    if (!proceed) return;
    try {
      await deleteVolleyTeam(team.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      toast.success(`Time "${team.name}" excluído.`);
    } catch (e) {
      console.error('deleteVolleyTeam', e);
      toast.error('Não conseguimos excluir o time agora.');
    }
  };

  return (
    <HtmlScreen>
      <HtmlHeader
        title="Meus times"
        subtitle="Cadastros reutilizáveis para suas partidas"
        onBack={() => nav.goBack()}
      />

      <div style={{ marginBottom: 16 }}>
        <HtmlButton title="+ Novo time" onClick={() => nav.navigate('VolleyTeamEdit')} />
      </div>

      {loading ? null : teams.length === 0 ? (
        <HtmlEmpty
          emoji="🏐"
          title="Nenhum time cadastrado"
          subtitle="Crie um time com seus jogadores pra reutilizar em várias partidas sem precisar cadastrar de novo."
        />
      ) : (
        teams.map((team) => (
          <HtmlCard key={team.id} onClick={() => nav.navigate('VolleyTeamDashboard', { teamId: team.id })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: c.text }}>{team.name}</div>
                <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
                  {team.players.length} jogador{team.players.length === 1 ? '' : 'es'}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(team);
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: c.surfaceVariant,
                  border: 'none',
                  color: c.danger,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Excluir
              </button>
              <span style={{ fontSize: 22, color: c.textMuted }}>›</span>
            </div>
          </HtmlCard>
        ))
      )}
    </HtmlScreen>
  );
};
