import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type EventsStackParamList = {
  EventsList: { initialFilter?: 'upcoming' | 'history' | 'all' } | undefined;
  CreateEvent: undefined;
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
  Notifications: undefined;
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
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Volley: NavigatorScreenParams<VolleyStackParamList>;
};
