import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../navigation/types';

type Nav = BottomTabNavigationProp<MainTabParamList>;

const STEPS = [
  {
    emoji: '👥',
    title: '1. Adicione amigos',
    desc: 'Conecte-se com pessoas que jogam com você. Só seus amigos aparecem nos seus jogos.',
  },
  {
    emoji: '📅',
    title: '2. Crie um evento',
    desc: 'Escolha o esporte, local, horário e convide quem vai participar.',
  },
  {
    emoji: '⭐',
    title: '3. Defina as estrelas',
    desc: 'Como organizador, você dá de 1 a 5 estrelas pro nível de cada jogador.',
  },
  {
    emoji: '🎲',
    title: '4. Sorteie os times',
    desc: 'O Timeco equilibra os times automaticamente pelas estrelas (e idade/altura quando faz sentido).',
  },
  {
    emoji: '⚽',
    title: '5. Bora jogar!',
    desc: 'Cada time recebe uma cor. Compartilhe e divirta-se.',
  },
];

export const HomeScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<Nav>();

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] ?? 'atleta'} 👋</Text>
        <Text style={styles.title}>Bem-vindo ao Timeco</Text>
        <Text style={styles.subtitle}>
          O jeito mais simples de montar times equilibrados pra qualquer esporte.
        </Text>
      </View>

      <View style={styles.quickActions}>
        <Button title="➕  Criar evento" onPress={() => nav.navigate('Jogos', { screen: 'CreateEvent' } as never)} />
        <View style={{ height: spacing.sm }} />
        <Button
          title="👥  Adicionar amigos"
          variant="outline"
          onPress={() => nav.navigate('Social', { screen: 'AddFriend' } as never)}
        />
      </View>

      <Text style={styles.sectionTitle}>Como funciona</Text>
      {STEPS.map((s) => (
        <Card key={s.title} style={styles.step}>
          <Text style={styles.stepEmoji}>{s.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{s.title}</Text>
            <Text style={styles.stepDesc}>{s.desc}</Text>
          </View>
        </Card>
      ))}

      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Dica</Text>
        <Text style={styles.tipText}>
          Apenas o organizador do evento define as estrelas dos jogadores. O sorteio mistura bem
          atletas fortes e iniciantes em cada time.
        </Text>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 22,
  },
  quickActions: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stepEmoji: {
    fontSize: 38,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  stepDesc: {
    marginTop: 2,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.primaryLight,
    borderRadius: radius.lg,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
