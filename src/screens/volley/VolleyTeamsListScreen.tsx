import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Button, Card, EmptyState } from '../../components';
import { useAuthStore, useThemedColors } from '../../store';
import { ColorPalette, spacing, radius } from '../../constants/theme';
import { deleteVolleyTeam } from '../../services/volleyTeamService';
import {
  listUserVolleyTeamsCached,
  invalidateVolleyTeamsCache,
} from '../../services/volleyCacheService';
import { VolleyTeam } from '../../types';
import { toast } from '../../store/toastStore';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyTeamsList'>;

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    body: { flex: 1 },
    name: { fontSize: 16, fontWeight: '800', color: c.text },
    meta: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    chev: { fontSize: 22, color: c.textMuted },
    deleteBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceVariant,
    },
    deleteTxt: { fontSize: 12, fontWeight: '700', color: c.danger },
  });

/** Lista de times cadastrados do user. Permite criar, editar e excluir. */
export const VolleyTeamsListScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [teams, setTeams] = useState<VolleyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const styles = makeStyles(c);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await listUserVolleyTeamsCached(user.id);
      setTeams(list);
    } catch (e) {
      console.error('listUserVolleyTeams', e);
      toast.error('Erro ao carregar times. Tente recarregar.');
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
    const proceed =
      typeof window !== 'undefined' ? window.confirm(`Excluir o time "${team.name}"?`) : true;
    if (!proceed) return;
    try {
      await deleteVolleyTeam(team.id);
      if (user) invalidateVolleyTeamsCache(user.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      toast.success(`Time "${team.name}" excluído.`);
    } catch (e) {
      console.error('deleteVolleyTeam', e);
      toast.error('Não conseguimos excluir o time agora.');
    }
  };

  return (
    <Screen>
      <Header
        title="Meus times"
        subtitle="Cadastros reutilizáveis para suas partidas"
        onBack={() => nav.goBack()}
      />

      <View style={{ marginBottom: spacing.lg }}>
        <Button
          title="+ Novo time"
          onPress={() => nav.navigate('VolleyTeamEdit')}
        />
      </View>

      {loading ? null : teams.length === 0 ? (
        <EmptyState
          emoji="🏐"
          title="Nenhum time cadastrado"
          description="Crie um time com seus jogadores pra reutilizar em várias partidas sem precisar cadastrar de novo."
        />
      ) : (
        teams.map((team) => (
          <Card
            key={team.id}
            style={styles.row}
            onPress={() => nav.navigate('VolleyTeamDashboard', { teamId: team.id })}
          >
            <View style={styles.body}>
              <Text style={styles.name}>{team.name}</Text>
              <Text style={styles.meta}>
                {team.players.length} jogador{team.players.length === 1 ? '' : 'es'}
              </Text>
            </View>
            <Pressable
              style={styles.deleteBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                onDelete(team);
              }}
              hitSlop={8}
            >
              <Text style={styles.deleteTxt}>Excluir</Text>
            </Pressable>
            <Text style={styles.chev}>›</Text>
          </Card>
        ))
      )}
    </Screen>
  );
};
