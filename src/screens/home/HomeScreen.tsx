import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen, SectionTitle, NotificationBell } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors, useUnreadCount } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import { computeProfileCompletion } from '../../hooks/useProfileCompletion';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../navigation/types';

import { ProfileCompletionBanner } from './components/ProfileCompletionBanner';
import { UpcomingEvents } from './components/UpcomingEvents';
import { UtilitiesList, UtilityItem } from './components/UtilitiesList';

type Nav = BottomTabNavigationProp<MainTabParamList>;

interface QuickButtonProps {
  emoji: string;
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
}

const QuickBtn: React.FC<QuickButtonProps> = ({ emoji, label, onPress, variant = 'solid' }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    btn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: variant === 'outline' ? colors.surface : colors.primary,
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: colors.border,
    },
    emoji: { fontSize: 20 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: variant === 'outline' ? colors.text : colors.white,
    },
  });
  return (
    <Pressable onPress={onPress} style={styles.btn}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

export const HomeScreen: React.FC = () => {
  useThemedColors();
  const responsive = useResponsive();
  const desktop = responsive.isDesktop;
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadCount();
  const completion = computeProfileCompletion(user);
  const nav = useNavigation<Nav>();

  // initial: false faz o React Navigation EMPILHAR a tela em cima da raiz
  // do stack (em vez de resetar). Resolve o bug de "voltar pra Jogos
  // mostra EventDetail em vez da lista" — agora a stack sempre tem
  // [EventsList, ...] como raiz.
  const goEditProfile = () =>
    nav.navigate('Perfil', { screen: 'EditProfile', initial: false } as never);
  const goCreate = () =>
    nav.navigate('Jogos', { screen: 'CreateEvent', initial: false } as never);
  const goEvents = () => nav.navigate('Jogos', { screen: 'EventsList' } as never);
  const goEventDetail = (eventId: string) =>
    nav.navigate('Jogos', {
      screen: 'EventDetail',
      params: { eventId },
      initial: false,
    } as never);
  const goAddFriend = () =>
    nav.navigate('Social', { screen: 'AddFriend', initial: false } as never);
  const goRequests = () =>
    nav.navigate('Social', { screen: 'FriendRequests', initial: false } as never);
  const goNotifications = () =>
    nav.navigate('Perfil', { screen: 'Notifications', initial: false } as never);
  const goVolley = () =>
    (nav as unknown as { navigate: (n: string, p?: unknown) => void }).navigate('Volley', {
      screen: 'VolleyHome',
    });
  const goScoreboard = () =>
    (nav as unknown as { navigate: (n: string, p?: unknown) => void }).navigate('Scoreboard', {
      screen: 'ScoreboardSetup',
    });

  const utilities: UtilityItem[] = [
    {
      emoji: '🏆',
      title: 'Placar eletrônico',
      description: 'Marcador digital pra usar durante o jogo.',
      onPress: goScoreboard,
    },
    {
      emoji: '🏐',
      title: 'Vôlei avançado · Scout',
      description: 'Estatísticas profissionais por jogador e set.',
      tag: 'EXTRA',
      onPress: goVolley,
    },
  ];

  const styles = StyleSheet.create({
    hero: {
      marginBottom: spacing.lg,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    heroText: { flex: 1 },
    greeting: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
    title: {
      fontSize: desktop ? 32 : 26,
      fontWeight: '900',
      color: colors.text,
      marginTop: 2,
      letterSpacing: -0.3,
    },
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.primaryLight,
      marginBottom: spacing.md,
    },
    alertEmoji: { fontSize: 22 },
    alertTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    alertSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    alertChev: { fontSize: 22, color: colors.textMuted },
    quickRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
  });

  const firstName = user?.name?.split(' ')[0] ?? 'atleta';

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.greeting}>Olá, {firstName} 👋</Text>
          <Text style={styles.title}>Bora jogar?</Text>
        </View>
        <NotificationBell />
      </View>

      {!completion.isComplete ? (
        <ProfileCompletionBanner completion={completion} onPress={goEditProfile} />
      ) : null}

      {unread > 0 ? (
        <Pressable style={styles.alertCard} onPress={goNotifications}>
          <Text style={styles.alertEmoji}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>
              {unread} notificação{unread === 1 ? '' : 'ões'} não lida{unread === 1 ? '' : 's'}
            </Text>
            <Text style={styles.alertSub}>Convites, mensagens e atualizações</Text>
          </View>
          <Text style={styles.alertChev}>›</Text>
        </Pressable>
      ) : null}

      <SectionTitle small>Próximos jogos</SectionTitle>
      {user ? (
        <UpcomingEvents
          userId={user.id}
          onPressEvent={goEventDetail}
          onPressViewAll={goEvents}
        />
      ) : null}

      <SectionTitle small>Ações rápidas</SectionTitle>
      <View style={styles.quickRow}>
        <QuickBtn emoji="➕" label="Criar evento" onPress={goCreate} />
        <QuickBtn emoji="👥" label="Adicionar amigo" onPress={goAddFriend} variant="outline" />
        <QuickBtn emoji="📨" label="Convites" onPress={goRequests} variant="outline" />
      </View>

      <SectionTitle small>Utilitários</SectionTitle>
      <UtilitiesList items={utilities} />
    </Screen>
  );
};
