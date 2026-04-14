import { SportId } from '../types';

export interface SportConfig {
  id: SportId;
  label: string;
  emoji: string;
  defaultPlayersPerTeam: number;
  defaultTeamsCount: number;
  usesHeightBalance: boolean;
  usesAgeBalance: boolean;
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
  },
  {
    id: 'futsal',
    label: 'Futsal',
    emoji: '🥅',
    defaultPlayersPerTeam: 5,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: true,
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
  },
  {
    id: 'handball',
    label: 'Handebol',
    emoji: '🤾',
    defaultPlayersPerTeam: 7,
    defaultTeamsCount: 2,
    usesHeightBalance: true,
    usesAgeBalance: true,
  },
  {
    id: 'tableTennis',
    label: 'Tênis de Mesa',
    emoji: '🏓',
    defaultPlayersPerTeam: 2,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
  },
  {
    id: 'tennis',
    label: 'Tênis',
    emoji: '🎾',
    defaultPlayersPerTeam: 2,
    defaultTeamsCount: 2,
    usesHeightBalance: false,
    usesAgeBalance: false,
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
