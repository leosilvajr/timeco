import { SportId } from '../types';

export interface SportConfig {
  id: SportId;
  label: string;
  emoji: string;
  defaultPlayersPerTeam: number;
  defaultTeamsCount: number;
  usesHeightBalance: boolean;
  usesAgeBalance: boolean;
  /**
   * Se true, o sorteio considera o peso do jogador (quando informado)
   * como critério adicional. Faz sentido em modalidades de contato.
   */
  usesWeightBalance?: boolean;
  /** true se a modalidade é tipicamente 1 contra 1 (2 pessoas no total). */
  isOneVsOne?: boolean;
}

export const SPORTS: SportConfig[] = [
  {
    id: 'soccer',
    label: 'Futebol',
    emoji: '⚽',
    defaultPlayersPerTeam: 11,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: true,
    usesWeightBalance: true,
  },
  {
    id: 'futsal',
    label: 'Futsal',
    emoji: '🥅',
    defaultPlayersPerTeam: 5,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: true,
    usesWeightBalance: true,
  },
  {
    id: 'volleyball',
    label: 'Vôlei',
    emoji: '🏐',
    defaultPlayersPerTeam: 6,
    defaultTeamsCount: 2,
    usesHeightBalance: true,
    usesAgeBalance: false,
  },
  {
    id: 'beachVolley',
    label: 'Vôlei de Praia',
    emoji: '🏖️',
    defaultPlayersPerTeam: 2,
    defaultTeamsCount: 2,
    usesHeightBalance: true,
    usesAgeBalance: false,
  },
  {
    id: 'basketball',
    label: 'Basquete',
    emoji: '🏀',
    defaultPlayersPerTeam: 5,
    defaultTeamsCount: 2,
    usesHeightBalance: true,
    usesAgeBalance: true,
    usesWeightBalance: true,
  },
  {
    id: 'handball',
    label: 'Handebol',
    emoji: '🤾',
    defaultPlayersPerTeam: 7,
    defaultTeamsCount: 2,
    usesHeightBalance: true,
    usesAgeBalance: true,
    usesWeightBalance: true,
  },
  // ============ 1 contra 1 ============
  {
    id: 'tennis',
    label: 'Tênis',
    emoji: '🎾',
    defaultPlayersPerTeam: 1,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
    isOneVsOne: true,
  },
  {
    id: 'tableTennis',
    label: 'Tênis de Mesa',
    emoji: '🏓',
    defaultPlayersPerTeam: 1,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
    isOneVsOne: true,
  },
  {
    id: 'padel',
    label: 'Padel',
    emoji: '🎾',
    defaultPlayersPerTeam: 2,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
  },
  {
    id: 'beachTennis',
    label: 'Beach Tennis',
    emoji: '🏖️',
    defaultPlayersPerTeam: 2,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
  },
  {
    id: 'badminton',
    label: 'Badminton',
    emoji: '🏸',
    defaultPlayersPerTeam: 1,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
    isOneVsOne: true,
  },
  {
    id: 'squash',
    label: 'Squash',
    emoji: '🎯',
    defaultPlayersPerTeam: 1,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
    isOneVsOne: true,
  },
  {
    id: 'pickleball',
    label: 'Pickleball',
    emoji: '🥒',
    defaultPlayersPerTeam: 2,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
  },
  {
    id: 'chess',
    label: 'Xadrez',
    emoji: '♟️',
    defaultPlayersPerTeam: 1,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
    isOneVsOne: true,
  },
  {
    id: 'pool',
    label: 'Sinuca',
    emoji: '🎱',
    defaultPlayersPerTeam: 1,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
    isOneVsOne: true,
  },
  {
    id: 'esports',
    label: 'E-sports',
    emoji: '🎮',
    defaultPlayersPerTeam: 1,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
    isOneVsOne: true,
  },
  {
    id: 'other',
    label: 'Outro',
    emoji: '🏅',
    defaultPlayersPerTeam: 5,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
  },
];

export const getSport = (id: SportId): SportConfig =>
  SPORTS.find((s) => s.id === id) ?? SPORTS[SPORTS.length - 1];
