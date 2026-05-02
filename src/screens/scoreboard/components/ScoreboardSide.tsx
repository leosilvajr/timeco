import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { spacing, radius } from '../../../constants/theme';

interface Props {
  name: string;
  score: number;
  setsWon: number;
  isMatchPoint: boolean;
  isSetPoint: boolean;
  bgColor: string;
  textColor: string;
  desktop: boolean;
  onPlus: () => void;
  onMinus: () => void;
  isWinner: boolean;
}

const MAX_SETS_DISPLAY = 5;

/**
 * Lado do placar (um time). Mostra nome + bolinhas de sets ganhos +
 * pontuação gigante animada + botões + e −. Anima escala ao pontuar
 * (spring) e vibra no mobile.
 */
export const ScoreboardSide: React.FC<Props> = ({
  name,
  score,
  setsWon,
  isMatchPoint,
  isSetPoint,
  bgColor,
  textColor,
  desktop,
  onPlus,
  onMinus,
  isWinner,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastScore = useRef(score);

  useEffect(() => {
    if (score === lastScore.current) return;
    const grew = score > lastScore.current;
    lastScore.current = score;
    if (!grew) return;
    scaleAnim.setValue(0.7);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 80,
    }).start();
    if (Platform.OS !== 'web') Vibration.vibrate(20);
  }, [score, scaleAnim]);

  const styles = StyleSheet.create({
    side: {
      flex: 1,
      backgroundColor: bgColor,
      borderRadius: radius.xl,
      padding: spacing.lg,
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: desktop ? 480 : 340,
      gap: spacing.md,
    },
    name: {
      fontSize: desktop ? 26 : 20,
      fontWeight: '900',
      color: textColor,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    setsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
    setBubble: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    setBubbleFilled: { backgroundColor: textColor },
    scoreWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    score: {
      fontSize: desktop ? 200 : 140,
      fontWeight: '900',
      color: textColor,
      lineHeight: desktop ? 220 : 160,
      letterSpacing: -4,
      textShadowColor: 'rgba(0,0,0,0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 6,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.95)',
      marginTop: 6,
    },
    badgeTxt: {
      fontSize: 12,
      fontWeight: '900',
      color: '#DB4437',
      letterSpacing: 1,
    },
    winnerBanner: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.95)',
      marginTop: 4,
    },
    winnerTxt: {
      fontSize: 14,
      fontWeight: '900',
      color: bgColor,
      letterSpacing: 0.5,
    },
    btnRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
    btn: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingVertical: desktop ? 18 : 14,
      borderRadius: radius.lg,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    btnPlus: { backgroundColor: 'rgba(255,255,255,0.95)' },
    btnTxt: { fontSize: desktop ? 22 : 18, fontWeight: '900', color: textColor },
    btnPlusTxt: { color: bgColor },
  });

  const setsArr = Array.from({ length: MAX_SETS_DISPLAY }, (_, i) => i < setsWon);

  return (
    <View style={styles.side}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.setsRow}>
          {setsArr.map((filled, i) => (
            <View key={i} style={[styles.setBubble, filled && styles.setBubbleFilled]} />
          ))}
        </View>
        {isMatchPoint ? (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>MATCH POINT</Text>
          </View>
        ) : isSetPoint ? (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>SET POINT</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.scoreWrap}>
        <Animated.Text style={[styles.score, { transform: [{ scale: scaleAnim }] }]}>
          {score}
        </Animated.Text>
        {isWinner ? (
          <View style={styles.winnerBanner}>
            <Text style={styles.winnerTxt}>🏆 VENCEDOR</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.btnRow}>
        <Pressable style={styles.btn} onPress={onMinus}>
          <Text style={styles.btnTxt}>−</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnPlus]} onPress={onPlus}>
          <Text style={[styles.btnTxt, styles.btnPlusTxt]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
};
