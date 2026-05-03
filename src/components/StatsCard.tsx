import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';
import { useThemedColors } from '../store';
import { UserStats } from '../services/userStatsService';
import { getSport } from '../constants/sports';

interface Props {
  stats: UserStats;
}

export const StatsCard: React.FC<Props> = ({ stats }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    statBox: {
      flexBasis: '48%',
      flexGrow: 1,
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      gap: 2,
    },
    statBig: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.primary,
      lineHeight: 32,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      textAlign: 'center',
    },
    statSub: {
      fontSize: 10,
      color: colors.textMuted,
      textAlign: 'center',
    },
    badgesTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    badgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.primaryLight,
    },
    badgeEmoji: { fontSize: 16 },
    badgeLabel: { fontSize: 12, fontWeight: '800', color: colors.text },
    empty: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
  });

  const topSportLabel = stats.topSport
    ? `${getSport(stats.topSport.id).emoji} ${getSport(stats.topSport.id).label}`
    : '—';

  return (
    <View>
      <Text style={styles.title}>📊 Estatísticas</Text>

      {stats.totalEvents === 0 ? (
        <Text style={styles.empty}>
          Você ainda não participou de eventos. Crie ou aceite um convite pra começar.
        </Text>
      ) : (
        <>
          <View style={styles.grid}>
            <View style={styles.statBox}>
              <Text style={styles.statBig}>{stats.totalEvents}</Text>
              <Text style={styles.statLabel}>Eventos</Text>
              <Text style={styles.statSub}>no total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBig}>{stats.asOrganizer}</Text>
              <Text style={styles.statLabel}>Organizou</Text>
              <Text style={styles.statSub}>como dono</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statBig, { fontSize: 16, lineHeight: 18 }]}>
                {topSportLabel}
              </Text>
              <Text style={styles.statLabel}>Esporte top</Text>
              <Text style={styles.statSub}>
                {stats.topSport ? `${stats.topSport.count} eventos` : 'sem dados'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBig}>{stats.uniqueSports}</Text>
              <Text style={styles.statLabel}>Modalidades</Text>
              <Text style={styles.statSub}>diferentes</Text>
            </View>
          </View>

          {stats.badges.length > 0 ? (
            <>
              <Text style={styles.badgesTitle}>🏆 Conquistas ({stats.badges.length})</Text>
              <View style={styles.badgesGrid}>
                {stats.badges.map((b) => (
                  <View key={b.id} style={styles.badge}>
                    <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                    <Text style={styles.badgeLabel}>{b.label}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </View>
  );
};
