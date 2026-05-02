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
  ThemeSettings: undefined;
  PrivacySettings: undefined;
  Notifications: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ThemeSettings: undefined;
  PrivacySettings: undefined;
};

export type HelpStackParamList = {
  HelpHome: undefined;
};

export type MainTabParamList = {
  Inicio: undefined;
  Jogos: NavigatorScreenParams<EventsStackParamList>;
  Social: NavigatorScreenParams<SocialStackParamList>;
  Config: NavigatorScreenParams<SettingsStackParamList>;
  Ajuda: NavigatorScreenParams<HelpStackParamList>;
  Perfil: NavigatorScreenParams<ProfileStackParamList>;
};

export type VolleyStackParamList = {
  VolleyHome: undefined;
  VolleyMatchSetup: undefined;
  VolleyScout: { matchId: string };
  VolleyRotation: { matchId: string };
  VolleyReports: { matchId: string };
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
