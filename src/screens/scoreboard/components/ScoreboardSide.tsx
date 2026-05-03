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
      padding: desktop ? spacing.lg : spacing.md,
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: desktop ? 480 : 280,
      gap: desktop ? spacing.md : spacing.sm,
    },
    name: {
      fontSize: desktop ? 26 : 16,
      fontWeight: '900',
      color: textColor,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    setsRow: { flexDirection: 'row', gap: desktop ? 6 : 4, marginTop: 4 },
    setBubble: {
      width: desktop ? 14 : 10,
      height: desktop ? 14 : 10,
      borderRadius: desktop ? 7 : 5,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    setBubbleFilled: { backgroundColor: textColor },
    scoreWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    score: {
      fontSize: desktop ? 200 : 96,
      fontWeight: '900',
      color: textColor,
      lineHeight: desktop ? 220 : 110,
      letterSpacing: desktop ? -4 : -2,
      textShadowColor: 'rgba(0,0,0,0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 6,
    },
    badge: {
      paddingHorizontal: desktop ? 12 : 8,
      paddingVertical: desktop ? 4 : 2,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.95)',
      marginTop: 6,
    },
    badgeTxt: {
      fontSize: desktop ? 12 : 9,
      fontWeight: '900',
      color: '#DB4437',
      letterSpacing: desktop ? 1 : 0.5,
    },
    winnerBanner: {
      paddingHorizontal: desktop ? 16 : 10,
      paddingVertical: desktop ? 6 : 3,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.95)',
      marginTop: 4,
    },
    winnerTxt: {
      fontSize: desktop ? 14 : 11,
      fontWeight: '900',
      color: bgColor,
      letterSpacing: 0.5,
    },
    btnRow: { flexDirection: 'row', gap: desktop ? spacing.sm : 6, width: '100%' },
    btn: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingVertical: desktop ? 18 : 10,
      borderRadius: radius.lg,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    btnPlus: { backgroundColor: 'rgba(255,255,255,0.95)' },
    btnTxt: { fontSize: desktop ? 22 : 16, fontWeight: '900', color: textColor },
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
