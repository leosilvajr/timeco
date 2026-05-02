import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import {
  registerPoint,
  resetRotation,
  rotateManual,
  rotateManualBack,
  subscribeVolleyMatch,
  undoLastPoint,
} from '../../services/volleyScoutService';
import { positionZone } from '../../services/volleyRotation';
import { VolleyMatch } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyRotation'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyRotation'>;

export const VolleyRotationScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const { matchId } = route.params;
  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [autoRotation, setAutoRotation] = useState(true);

  useEffect(() => {
    const unsub = subscribeVolleyMatch(matchId, (m) => setMatch(m));
    return () => unsub();
  }, [matchId]);

  const styles = StyleSheet.create({
    autoBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    autoTxt: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      marginRight: spacing.sm,
    },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceVariant,
    },
    pillOn: {
      backgroundColor: colors.success,
    },
    pillTxt: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 13,
    },
    pillTxtOn: {
      color: colors.white,
    },
    court: {
      backgroundColor: '#9FE2BF',
      borderRadius: radius.lg,
      borderWidth: 3,
      borderColor: colors.success,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    grid: {
      gap: spacing.sm,
    },
    gridRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    posCard: {
      flex: 1,
      minHeight: 70,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.border,
      padding: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    posCardServe: {
      borderColor: colors.danger,
    },
    posCardNet: {
      borderColor: colors.warning,
    },
    posCardBack: {
      borderColor: '#94A3B8',
    },
    posIndex: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.primary,
    },
    posName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginTop: 2,
    },
    posSub: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.lg,
      marginTop: spacing.sm,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 3,
      borderWidth: 2,
    },
    score: {
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    scoreRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    scoreTxt: { fontSize: 14, color: colors.text, fontWeight: '600' },
    scoreNum: { fontSize: 22, fontWeight: '900', color: colors.primary },
    serveLine: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    pointButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    pointBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    pointBtnA: { backgroundColor: colors.primary },
    pointBtnB: { backgroundColor: colors.danger },
    pointBtnTxt: { color: colors.white, fontWeight: '800' },
    rotControls: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    rotControl: { flex: 1, minWidth: 140 },
    counters: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    counterCol: { alignItems: 'center' },
    counterNum: { fontSize: 22, fontWeight: '900', color: colors.text },
    counterLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  });

  if (!match) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const currentSetData = match.sets.find((s) => s.number === match.currentSet);
  const playerByNumber: Record<number, { name: string; number: number }> = {};
  for (const p of match.players) playerByNumber[p.number] = p;

  // Layout da quadra: linha de cima = posições 4, 3, 2 (rede); linha de baixo = 5, 6, 1.
  const renderPos = (pos: number) => {
    const playerNum = match.currentRotation[pos - 1];
    const player = playerNum ? playerByNumber[playerNum] : null;
    const zone = positionZone(pos);
    return (
      <View
        key={pos}
        style={[
          styles.posCard,
          zone === 'serve' ? styles.posCardServe : zone === 'net' ? styles.posCardNet : styles.posCardBack,
        ]}
      >
        <Text style={styles.posIndex}>{pos}</Text>
        {player ? (
          <>
            <Text style={styles.posName} numberOfLines={1}>{player.name}</Text>
            <Text style={styles.posSub}>#{player.number}</Text>
          </>
        ) : (
          <Text style={styles.posSub}>{zone === 'serve' ? 'Sacador' : 'Vazio'}</Text>
        )}
      </View>
    );
  };

  return (
    <Screen maxWidth={840}>
      <Header title="Rodízio" subtitle={`Sistema ${match.rotationSystem} · Set ${match.currentSet}`} onBack={() => nav.goBack()} />

      <View style={styles.autoBar}>
        <Text style={styles.autoTxt}>
          Rodízio automático: rotaciona a equipe quando ela ganha um sideout (recebia e fez ponto).
        </Text>
        <Pressable
          onPress={() => setAutoRotation((v) => !v)}
          style={[styles.pill, autoRotation && styles.pillOn]}
        >
          <Text style={[styles.pillTxt, autoRotation && styles.pillTxtOn]}>
            {autoRotation ? 'AUTO ON' : 'MANUAL'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.court}>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            {renderPos(4)}
            {renderPos(3)}
            {renderPos(2)}
          </View>
          <View style={styles.gridRow}>
            {renderPos(5)}
            {renderPos(6)}
            {renderPos(1)}
          </View>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { borderColor: colors.danger }]} />
            <Text style={{ fontSize: 11, color: colors.text }}>Sacador</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { borderColor: colors.warning }]} />
            <Text style={{ fontSize: 11, color: colors.text }}>Rede</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { borderColor: '#94A3B8' }]} />
            <Text style={{ fontSize: 11, color: colors.text }}>Fundo</Text>
          </View>
        </View>
      </View>

      <View style={styles.score}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreTxt}>{match.teamAName}</Text>
          <Text style={styles.scoreNum}>{currentSetData?.scoreA ?? 0}</Text>
        </View>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreTxt}>{match.teamBName}</Text>
          <Text style={styles.scoreNum}>{currentSetData?.scoreB ?? 0}</Text>
        </View>
        <Text style={styles.serveLine}>
          Saque: <Text style={{ fontWeight: '800' }}>{match.serveTeam === 'A' ? match.teamAName : match.teamBName}</Text>
        </Text>
      </View>

      <View style={styles.pointButtons}>
        <Pressable
          style={[styles.pointBtn, styles.pointBtnA]}
          onPress={() => registerPoint(match, 'A', autoRotation)}
        >
          <Text style={styles.pointBtnTxt}>+ Ponto {match.teamAName}</Text>
        </Pressable>
        <Pressable
          style={[styles.pointBtn, styles.pointBtnB]}
          onPress={() => registerPoint(match, 'B', autoRotation)}
        >
          <Text style={styles.pointBtnTxt}>+ Ponto {match.teamBName}</Text>
        </Pressable>
      </View>

      <View style={{ marginBottom: spacing.md }}>
        <Button
          title="↩️ Desfazer último ponto"
          variant="outline"
          onPress={() => undoLastPoint(match)}
          disabled={match.pointHistory.length === 0}
        />
      </View>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: spacing.sm }}>
          RODÍZIO MANUAL
        </Text>
        <View style={styles.rotControls}>
          <View style={styles.rotControl}>
            <Button title="🔄 Rodar" onPress={() => rotateManual(match)} />
          </View>
          <View style={styles.rotControl}>
            <Button title="↺ Volta" variant="outline" onPress={() => rotateManualBack(match)} />
          </View>
          <View style={styles.rotControl}>
            <Button title="Resetar posições" variant="outline" onPress={() => resetRotation(match)} />
          </View>
        </View>
      </Card>

      <View style={styles.counters}>
        <View style={styles.counterCol}>
          <Text style={styles.counterNum}>{match.rotationCount}</Text>
          <Text style={styles.counterLabel}>Rotações</Text>
        </View>
        <View style={styles.counterCol}>
          <Text style={styles.counterNum}>{match.pointsCount}</Text>
          <Text style={styles.counterLabel}>Pontos</Text>
        </View>
        <View style={styles.counterCol}>
          <Text style={styles.counterNum}>{match.pointHistory.length}</Text>
          <Text style={styles.counterLabel}>Histórico</Text>
        </View>
      </View>
    </Screen>
  );
};
