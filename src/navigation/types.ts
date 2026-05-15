import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type EventsStackParamList = {
  EventsList: { initialFilter?: 'upcoming' | 'history' | 'all' } | undefined;
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  EventDetail: { eventId: string };
  RatePlayers: { eventId: string };
  DrawResult: { eventId: string };
  QuickDraw: undefined;
};

export type SocialStackParamList = {
  FriendsList: undefined;
  AddFriend: undefined;
  FriendRequests: undefined;
  PlayerProfile: { userId: string };
  Chat: { friendId: string; friendName: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  SuperAdmin: undefined;
  ReportsAdmin: undefined;
  ThemeSettings: undefined;
  PrivacySettings: undefined;
  Notifications: undefined;
  SettingsHome: undefined;
  HelpHome: undefined;
};

export type MainTabParamList = {
  Inicio: undefined;
  Jogos: NavigatorScreenParams<EventsStackParamList>;
  Social: NavigatorScreenParams<SocialStackParamList>;
  Perfil: NavigatorScreenParams<ProfileStackParamList>;
};

export type VolleyStackParamList = {
  VolleyHome: undefined;
  VolleyMatchSetup: undefined;
  VolleyScout: { matchId: string };
  VolleyRotation: { matchId: string };
  VolleyReports: { matchId: string };
  VolleyTeamsList: undefined;
  /** teamId opcional — quando passado, abre em modo "editar"; senao "criar novo". */
  VolleyTeamEdit: { teamId?: string } | undefined;
  /** Estatisticas agregadas do time atraves do historico de partidas. */
  VolleyTeamDashboard: { teamId: string };
};

export type ScoreboardStackParamList = {
  ScoreboardSetup: undefined;
  ScoreboardLive: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Volley: NavigatorScreenParams<VolleyStackParamList>;
  Scoreboard: NavigatorScreenParams<ScoreboardStackParamList>;
};
