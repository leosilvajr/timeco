import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '../../../components';
import { colors, spacing, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';
import { emptyPlayerStats } from '../../../services/volleyStats';
import { PlayerVolleyStats, VolleyAction, VolleyPlayer, VolleySetData } from '../../../types';

interface ActionDef {
  action: VolleyAction;
  label: string;
  variant: 'good' | 'neutral' | 'bad' | 'gold';
}

export const ACTIONS_BY_GROUP: Record<string, ActionDef[]> = {
  '🏐 SAQUE': [
    { action: 'serve_success', label: 'Certo', variant: 'good' },
    { action: 'ace', label: 'Ace', variant: 'gold' },
    { action: 'serve_error', label: 'Erro', variant: 'bad' },
  ],
  '⚡ ATAQUE': [
    { action: 'attack_point', label: 'Ponto', variant: 'good' },
    { action: 'attack', label: 'Normal', variant: 'neutral' },
    { action: 'attack_error', label: 'Erro', variant: 'bad' },
  ],
  '📡 PASSE': [
    { action: 'pass_a', label: 'A', variant: 'good' },
    { action: 'pass_b', label: 'B', variant: 'gold' },
    { action: 'pass_c', label: 'C', variant: 'bad' },
  ],
  '🛡️ BLOQUEIO': [
    { action: 'block_success', label: 'Sucesso', variant: 'good' },
    { action: 'block_error', label: 'Falha', variant: 'bad' },
  ],
  '🎯 LEVANTAMENTO': [
    { action: 'set_success', label: 'Certo', variant: 'good' },
    { action: 'set_error', label: 'Erro', variant: 'bad' },
    { action: 'set_ponta', label: 'Ponta', variant: 'neutral' },
    { action: 'set_saida', label: 'Saída', variant: 'neutral' },
    { action: 'set_meio', label: 'Meio', variant: 'neutral' },
    { action: 'set_fundo_meio', label: 'F.Meio', variant: 'neutral' },
    { action: 'set_fundo_saida', label: 'F.Saída', variant: 'neutral' },
  ],
};

const ACTION_TO_FIELD: Record<VolleyAction, (s: PlayerVolleyStats) => number> = {
  serve_success: (s) => s.serves.success,
  serve_error: (s) => s.serves.error,
  ace: (s) => s.serves.ace,
  attack_point: (s) => s.attacks.success,
  attack: (s) => s.attacks.normal,
  attack_error: (s) => s.attacks.error,
  pass_a: (s) => s.passes.a,
  pass_b: (s) => s.passes.b,
  pass_c: (s) => s.passes.c,
  block_success: (s) => s.blocks.success,
  block_error: (s) => s.blocks.error,
  set_success: (s) => s.sets.success,
  set_error: (s) => s.sets.error,
  set_ponta: (s) => s.sets.ponta,
  set_saida: (s) => s.sets.saida,
  set_meio: (s) => s.sets.meio,
  set_fundo_meio: (s) => s.sets.fundo_meio,
  set_fundo_saida: (s) => s.sets.fundo_saida,
};

const countOf = (set: VolleySetData | undefined, playerNum: number, action: VolleyAction): number => {
  if (!set) return 0;
  const ps = set.playerStats[playerNum] ?? emptyPlayerStats();
  return ACTION_TO_FIELD[action](ps);
};

interface Props {
  player: VolleyPlayer;
  currentSet: VolleySetData | undefined;
  onTap: (player: VolleyPlayer, action: VolleyAction) => void;
  onMinus: (player: VolleyPlayer, action: VolleyAction) => void;
  desktop: boolean;
}

/**
 * Card de scout em tempo real de um jogador. Mostra todas as ações
 * agrupadas (saque/ataque/passe/bloqueio/levantamento) com contador
 * inline e botão de undo (-) por ação.
 */
export const PlayerActionsCard: React.FC<Props> = ({
  player,
  currentSet,
  onTap,
  onMinus,
  desktop,
}) => {
  useThemedColors();

  const variantBg = (v: ActionDef['variant']): string => {
    switch (v) {
      case 'good': return colors.success;
      case 'gold': return colors.warning;
      case 'bad': return colors.danger;
      default: return colors.info;
    }
  };

  const styles = StyleSheet.create({
    card: {
      marginBottom: desktop ? 0 : spacing.sm,
      flexBasis: desktop ? '48%' : '100%',
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    pNum: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pNumTxt: { color: colors.white, fontWeight: '900' },
    pName: { fontSize: 15, fontWeight: '800', color: colors.text },
    pPos: { fontSize: 12, color: colors.textSecondary },
    groupTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      marginTop: 8,
      marginBottom: 4,
    },
    actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingLeft: 10,
      paddingRight: 4,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    pillLabel: { fontSize: 12, fontWeight: '700' },
    pillCount: {
      minWidth: 26,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: radius.pill,
      fontSize: 12,
      fontWeight: '900',
      color: '#1B2B20',
      textAlign: 'center',
      marginLeft: 4,
    },
    minusBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    minusBtnTxt: { color: '#1B2B20', fontWeight: '900', fontSize: 14 },
  });

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.pNum}>
          <Text style={styles.pNumTxt}>{player.number}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pName}>{player.name}</Text>
          <Text style={styles.pPos}>{player.position}</Text>
        </View>
      </View>

      {Object.entries(ACTIONS_BY_GROUP).map(([group, actions]) => (
        <View key={group}>
          <Text style={styles.groupTitle}>{group}</Text>
          <View style={styles.actionsRow}>
            {actions.map((a) => (
              <View key={a.action} style={[styles.pill, { backgroundColor: variantBg(a.variant) }]}>
                <Pressable onPress={() => onTap(player, a.action)}>
                  <Text style={[styles.pillLabel, { color: colors.white }]}>{a.label}</Text>
                </Pressable>
                <Text style={styles.pillCount}>
                  {countOf(currentSet, player.number, a.action)}
                </Text>
                <Pressable style={styles.minusBtn} onPress={() => onMinus(player, a.action)}>
                  <Text style={styles.minusBtnTxt}>-</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ))}
    </Card>
  );
};
