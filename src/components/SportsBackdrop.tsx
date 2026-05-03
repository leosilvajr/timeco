import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing, Platform } from 'react-native';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface DecorItem {
  emoji: string;
  /** Posição X em % do container (0-100) */
  x: number;
  /** Posição Y em % do container (0-100) */
  y: number;
  size: number;
  /** Delay inicial pra dessincronizar a animação */
  delay: number;
  /** Rotação base em graus */
  rotation: number;
}

const DEFAULT_ITEMS: DecorItem[] = [
  { emoji: '⚽', x: 8, y: 8, size: 48, delay: 0, rotation: -12 },
  { emoji: '🏀', x: 85, y: 15, size: 44, delay: 600, rotation: 18 },
  { emoji: '🏐', x: 12, y: 78, size: 50, delay: 1200, rotation: 8 },
  { emoji: '🎾', x: 88, y: 70, size: 38, delay: 300, rotation: -20 },
  { emoji: '🏓', x: 50, y: 92, size: 36, delay: 900, rotation: 24 },
];

interface FloatingEmojiProps {
  item: DecorItem;
}

const FloatingEmoji: React.FC<FloatingEmojiProps> = ({ item }) => {
  const translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translate, {
          toValue: 1,
          duration: 3500,
          delay: item.delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [translate, item.delay]);

  const dy = translate.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const styles = StyleSheet.create({
    item: {
      position: 'absolute',
      left: `${item.x}%`,
      top: `${item.y}%`,
      opacity: 0.18,
    },
    emoji: {
      fontSize: item.size,
      transform: [{ rotate: `${item.rotation}deg` }],
    },
  });

  return (
    <Animated.View style={[styles.item, { transform: [{ translateY: dy }] }]} pointerEvents="none">
      <Text style={styles.emoji}>{item.emoji}</Text>
    </Animated.View>
  );
};

interface Props {
  items?: DecorItem[];
}

/**
 * Decoração de fundo com emojis esportivos flutuantes (loop suave).
 * Posicionado absoluto e ignorando toques (pointerEvents=none).
 */
export const SportsBackdrop: React.FC<Props> = ({ items = DEFAULT_ITEMS }) => {
  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      {items.map((it, i) => (
        <FloatingEmoji key={i} item={it} />
      ))}
    </View>
  );
};
