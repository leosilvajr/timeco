import React from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore, useThemedColors, useUnreadCount } from '../store';
import { colors } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';

import { HomeScreen } from '../screens/home/HomeScreen';

import { EventsListScreen } from '../screens/events/EventsListScreen';
import { CreateEventScreen } from '../screens/events/CreateEventScreen';
import { EventDetailScreen } from '../screens/events/EventDetailScreen';
import { RatePlayersScreen } from '../screens/events/RatePlayersScreen';
import { DrawResultScreen } from '../screens/events/DrawResultScreen';

import { FriendsListScreen } from '../screens/social/FriendsListScreen';
import { AddFriendScreen } from '../screens/social/AddFriendScreen';
import { FriendRequestsScreen } from '../screens/social/FriendRequestsScreen';
import { PlayerProfileScreen } from '../screens/social/PlayerProfileScreen';
import { ChatScreen } from '../screens/social/ChatScreen';

import { ProfileHomeScreen } from '../screens/profile/ProfileHomeScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SuperAdminScreen } from '../screens/profile/SuperAdminScreen';
import { ThemeSettingsScreen } from '../screens/profile/ThemeSettingsScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';

import { VolleyHomeScreen } from '../screens/volley/VolleyHomeScreen';
import { VolleyMatchSetupScreen } from '../screens/volley/VolleyMatchSetupScreen';
import { VolleyScoutScreen } from '../screens/volley/VolleyScoutScreen';
import { VolleyRotationScreen } from '../screens/volley/VolleyRotationScreen';
import { VolleyReportsScreen } from '../screens/volley/VolleyReportsScreen';

import {
  AuthStackParamList,
  EventsStackParamList,
  MainTabParamList,
  ProfileStackParamList,
  RootStackParamList,
  SocialStackParamList,
  VolleyStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const EventsStack = createNativeStackNavigator<EventsStackParamList>();
const SocialStack = createNativeStackNavigator<SocialStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const VolleyStack = createNativeStackNavigator<VolleyStackParamList>();

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
    <EventsStack.Screen name="EventDetail" component={EventDetailScreen} />
    <EventsStack.Screen name="RatePlayers" component={RatePlayersScreen} />
    <EventsStack.Screen name="DrawResult" component={DrawResultScreen} />
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
    <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
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

const tabIcon = (emoji: string) => ({ color, focused }: { color: string; focused: boolean; size: number }) => (
  <Text style={{ fontSize: focused ? 24 : 22, color, opacity: focused ? 1 : 0.7 }}>{emoji}</Text>
);

const MainNavigator = () => {
  useThemedColors();
  const responsive = useResponsive();
  const desktop = responsive.isDesktop;
  const unread = useUnreadCount();
  const profileBadge = unread > 0 ? (unread > 99 ? '99+' : String(unread)) : undefined;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarPosition: desktop ? 'left' : 'bottom',
        tabBarLabelPosition: desktop ? 'beside-icon' : 'below-icon',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: desktop
          ? {
              backgroundColor: colors.surface,
              borderRightColor: colors.border,
              borderTopWidth: 0,
              width: 220,
              paddingTop: 24,
              paddingHorizontal: 12,
            }
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              height: 64,
              paddingTop: 6,
              paddingBottom: 8,
            },
        tabBarLabelStyle: desktop
          ? { fontSize: 14, fontWeight: '700', marginLeft: 8 }
          : { fontSize: 11, fontWeight: '700' },
        tabBarItemStyle: desktop
          ? {
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              borderRadius: 12,
              marginVertical: 4,
              paddingVertical: 12,
              paddingHorizontal: 12,
              height: 'auto',
            }
          : undefined,
        tabBarBadgeStyle: { backgroundColor: colors.danger, color: colors.white },
      }}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Início', tabBarIcon: tabIcon('🏠') }} />
      <Tab.Screen name="Jogos" component={EventsNavigator} options={{ tabBarIcon: tabIcon('🏟️') }} />
      <Tab.Screen name="Social" component={SocialNavigator} options={{ tabBarIcon: tabIcon('👥') }} />
      <Tab.Screen
        name="Perfil"
        component={ProfileNavigator}
        options={{ tabBarIcon: tabIcon('👤'), tabBarBadge: profileBadge }}
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
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};
