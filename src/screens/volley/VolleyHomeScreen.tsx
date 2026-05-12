import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, EmptyState, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import {
  deleteVolleyMatch,
  listUserVolleyMatches,
} from '../../services/volleyScoutService';
import { toast } from '../../store/toastStore';
import { VolleyMatch } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyHome'>;

const formatDateBR = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

const winsCount = (match: VolleyMatch): { a: number; b: number } => {
  let a = 0;
  let b = 0;
  for (const s of match.sets) {
    if (!s.finished) continue;
    if (s.scoreA > s.scoreB) a += 1;
    else if (s.scoreB > s.scoreA) b += 1;
  }
  return { a, b };
};

export const VolleyHomeScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const responsive = useResponsive();
  const cols = responsive.isDesktop ? 2 : 1;
  const user = useAuthStore((s) => s.user);
  const [matches, setMatches] = useState<VolleyMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setMatches(await listUserVolleyMatches(user.id));
    } catch (e) {
      console.error('listVolleyMatches', e);
      toast.error('Erro ao carregar partidas. Tente recarregar.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onDelete = async (m: VolleyMatch) => {
    const ok =
      typeof window !== 'undefined'
        ? window.confirm(`Apagar a partida "${m.teamAName} x ${m.teamBName}"?`)
        : true;
    if (!ok) return;
    try {
      await deleteVolleyMatch(m.id);
      setMatches((prev) => prev.filter((x) => x.id !== m.id));
      toast.success('Partida apagada.');
    } catch (e) {
      console.error('deleteVolleyMatch', e);
      toast.error('Erro ao apagar partida.');
    }
  };

  const styles = StyleSheet.create({
    intro: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    introTxt: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    matchCard: {
      marginBottom: spacing.sm,
    },
    matchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    title: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
      fontSize: 11,
      fontWeight: '700',
    },
    badgeProgress: {
      backgroundColor: colors.warning + '33',
      color: colors.warning,
    },
    badgeFinished: {
      backgroundColor: colors.success + '33',
      color: colors.success,
    },
    sub: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    score: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.primary,
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    deleteBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    deleteTxt: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '700',
    },
  });

  const renderMatch = ({ item }: { item: VolleyMatch }) => {
    const w = winsCount(item);
    const isFinished = item.status === 'finished';
    return (
      <Card style={[styles.matchCard, cols > 1 && { flex: 1 }]} onPress={() => nav.navigate('VolleyScout', { matchId: item.id })}>
        <View style={styles.matchHeader}>
          <Text style={styles.title}>
            {item.teamAName} x {item.teamBName}
          </Text>
          <Text style={[styles.badge, isFinished ? styles.badgeFinished : styles.badgeProgress]}>
            {isFinished ? 'FINALIZADO' : `SET ${item.currentSet}`}
          </Text>
        </View>
        <Text style={styles.sub}>
          {formatDateBR(item.date)} · {item.location} · Melhor de {item.format}
        </Text>
        <Text style={styles.score}>
          {w.a} x {w.b} sets
        </Text>
        <View style={styles.actions}>
          <Text style={styles.sub}>{item.players.length} jogadores</Text>
          <Pressable onPress={() => onDelete(item)} style={styles.deleteBtn}>
            <Text style={styles.deleteTxt}>Apagar</Text>
          </Pressable>
        </View>
      </Card>
    );
  };

  return (
    <Screen scroll={false}>
      <Header title="Vôlei Avançado" subtitle="Scout em tempo real, rodízio e relatórios" onBack={() => nav.getParent()?.goBack()} />

      <View style={styles.intro}>
        <Text style={styles.introTxt}>
          🏐 Modo avançado: registre cada ação dos seus jogadores (saque, ataque, passe, bloqueio,
          levantamento) durante a partida. Veja eficiência por jogador, controle o rodízio e gere
          relatórios detalhados por set.
        </Text>
      </View>

      <View style={{ marginBottom: spacing.md, gap: spacing.sm }}>
        <Button title="➕  Nova partida" onPress={() => nav.navigate('VolleyMatchSetup')} />
        <Button
          title="👥  Meus times"
          variant="outline"
          onPress={() => nav.navigate('VolleyTeamsList')}
        />
      </View>

      <FlatList
        data={matches}
        keyExtractor={(m) => m.id}
        key={`cols-${cols}`}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? { gap: spacing.md } : undefined}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={renderMatch}
        ListEmptyComponent={
          <EmptyState
            emoji="🏐"
            title="Nenhuma partida ainda"
            description="Cadastre sua primeira partida pra começar a registrar estatísticas dos jogadores em tempo real."
          />
        }
        contentContainerStyle={matches.length ? { paddingBottom: 80 } : { flex: 1 }}
      />
    </Screen>
  );
};
