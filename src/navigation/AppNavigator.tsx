import React from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore, useThemedColors, useUnreadCount } from '../store';
import { colors } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { DesktopSidebar } from './DesktopSidebar';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';

import { HomeScreen } from '../screens/home/HomeScreen';

import { EventsListScreen } from '../screens/events/EventsListScreen';
import { CreateEventScreen } from '../screens/events/CreateEventScreen';
import { EditEventScreen } from '../screens/events/EditEventScreen';
import { EventDetailScreen } from '../screens/events/EventDetailScreen';
import { RatePlayersScreen } from '../screens/events/RatePlayersScreen';
import { DrawResultScreen } from '../screens/events/DrawResultScreen';
import { QuickDrawScreen } from '../screens/events/QuickDrawScreen';

import { FriendsListScreen } from '../screens/social/FriendsListScreen';
import { AddFriendScreen } from '../screens/social/AddFriendScreen';
import { FriendRequestsScreen } from '../screens/social/FriendRequestsScreen';
import { PlayerProfileScreen } from '../screens/social/PlayerProfileScreen';
import { ChatScreen } from '../screens/social/ChatScreen';

import { ProfileHomeScreen } from '../screens/profile/ProfileHomeScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SuperAdminScreen } from '../screens/profile/SuperAdminScreen';
import { ThemeSettingsScreen } from '../screens/profile/ThemeSettingsScreen';
import { PrivacySettingsScreen } from '../screens/profile/PrivacySettingsScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';

import { SettingsHomeScreen } from '../screens/settings/SettingsHomeScreen';
import { HelpHomeScreen } from '../screens/help/HelpHomeScreen';

import { VolleyHomeScreen } from '../screens/volley/VolleyHomeScreen';
import { VolleyMatchSetupScreen } from '../screens/volley/VolleyMatchSetupScreen';
import { VolleyScoutScreen } from '../screens/volley/VolleyScoutScreen';
import { VolleyRotationScreen } from '../screens/volley/VolleyRotationScreen';
import { VolleyReportsScreen } from '../screens/volley/VolleyReportsScreen';

import { ScoreboardSetupScreen } from '../screens/scoreboard/ScoreboardSetupScreen';
import { ScoreboardLiveScreen } from '../screens/scoreboard/ScoreboardLiveScreen';

import {
  AuthStackParamList,
  EventsStackParamList,
  MainTabParamList,
  ProfileStackParamList,
  RootStackParamList,
  ScoreboardStackParamList,
  SocialStackParamList,
  VolleyStackParamList,
} from './types';
import { makeTabResetListeners } from './listeners';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const EventsStack = createNativeStackNavigator<EventsStackParamList>();
const SocialStack = createNativeStackNavigator<SocialStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const VolleyStack = createNativeStackNavigator<VolleyStackParamList>();
const ScoreboardStack = createNativeStackNavigator<ScoreboardStackParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
  </AuthStack.Navigator>
);

const EventsNavigator = () => (
  <EventsStack.Navigator screenOptions={{ headerShown: false }}>
    <EventsStack.Screen name="EventsList" component={EventsListScreen} />
    <EventsStack.Screen name="CreateEvent" component={CreateEventScreen} />
    <EventsStack.Screen name="EditEvent" component={EditEventScreen} />
    <EventsStack.Screen name="EventDetail" component={EventDetailScreen} />
    <EventsStack.Screen name="RatePlayers" component={RatePlayersScreen} />
    <EventsStack.Screen name="DrawResult" component={DrawResultScreen} />
    <EventsStack.Screen name="QuickDraw" component={QuickDrawScreen} />
  </EventsStack.Navigator>
);

const SocialNavigator = () => (
  <SocialStack.Navigator screenOptions={{ headerShown: false }}>
    <SocialStack.Screen name="FriendsList" component={FriendsListScreen} />
    <SocialStack.Screen name="AddFriend" component={AddFriendScreen} />
    <SocialStack.Screen name="FriendRequests" component={FriendRequestsScreen} />
    <SocialStack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
    <SocialStack.Screen name="Chat" component={ChatScreen} />
  </SocialStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileHomeScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="SuperAdmin" component={SuperAdminScreen} />
    <ProfileStack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
    <ProfileStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
    <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    <ProfileStack.Screen name="SettingsHome" component={SettingsHomeScreen} />
    <ProfileStack.Screen name="HelpHome" component={HelpHomeScreen} />
  </ProfileStack.Navigator>
);

const VolleyNavigator = () => (
  <VolleyStack.Navigator screenOptions={{ headerShown: false }}>
    <VolleyStack.Screen name="VolleyHome" component={VolleyHomeScreen} />
    <VolleyStack.Screen name="VolleyMatchSetup" component={VolleyMatchSetupScreen} />
    <VolleyStack.Screen name="VolleyScout" component={VolleyScoutScreen} />
    <VolleyStack.Screen name="VolleyRotation" component={VolleyRotationScreen} />
    <VolleyStack.Screen name="VolleyReports" component={VolleyReportsScreen} />
  </VolleyStack.Navigator>
);

const ScoreboardNavigator = () => (
  <ScoreboardStack.Navigator screenOptions={{ headerShown: false }}>
    <ScoreboardStack.Screen name="ScoreboardSetup" component={ScoreboardSetupScreen} />
    <ScoreboardStack.Screen name="ScoreboardLive" component={ScoreboardLiveScreen} />
  </ScoreboardStack.Navigator>
);

const tabIcon = (emoji: string) => ({ color, focused }: { color: string; focused: boolean; size: number }) => {
  const size = focused ? 24 : 22;
  return (
    <Text
      style={{
        fontSize: size,
        lineHeight: size + 4,
        color,
        opacity: focused ? 1 : 0.7,
        textAlign: 'center',
      }}
    >
      {emoji}
    </Text>
  );
};

const MainNavigator = () => {
  useThemedColors();
  const responsive = useResponsive();
  const desktop = responsive.isDesktop;
  const unread = useUnreadCount();
  const profileBadge = unread > 0 ? (unread > 99 ? '99+' : String(unread)) : undefined;

  return (
    <Tab.Navigator
      tabBar={desktop ? (props) => <DesktopSidebar {...props} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarPosition: desktop ? 'left' : 'bottom',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: desktop
          ? undefined
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              height: 76,
              paddingTop: 10,
              paddingBottom: 12,
            },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', lineHeight: 16, paddingBottom: 2 },
        tabBarBadgeStyle: { backgroundColor: colors.danger, color: colors.white },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ title: 'Início', tabBarIcon: tabIcon('🏠') }}
      />
      <Tab.Screen
        name="Jogos"
        component={EventsNavigator}
        options={{ tabBarIcon: tabIcon('🏟️') }}
        listeners={makeTabResetListeners('Jogos')}
      />
      <Tab.Screen
        name="Social"
        component={SocialNavigator}
        options={{ tabBarIcon: tabIcon('👥') }}
        listeners={makeTabResetListeners('Social')}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileNavigator}
        options={{ tabBarIcon: tabIcon('👤'), tabBarBadge: profileBadge }}
        listeners={makeTabResetListeners('Perfil')}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  useThemedColors();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const styles = StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
  });

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <RootStack.Screen name="Main" component={MainNavigator} />
          <RootStack.Screen name="Volley" component={VolleyNavigator} />
          <RootStack.Screen name="Scoreboard" component={ScoreboardNavigator} />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};
