import React from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore, useThemedColors } from '../store';
import { colors } from '../constants/theme';

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

import {
  AuthStackParamList,
  EventsStackParamList,
  MainTabParamList,
  ProfileStackParamList,
  RootStackParamList,
  SocialStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const EventsStack = createNativeStackNavigator<EventsStackParamList>();
const SocialStack = createNativeStackNavigator<SocialStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

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
  </ProfileStack.Navigator>
);

const tabIcon = (emoji: string) => ({ color }: { color: string; focused: boolean; size: number }) => (
  <Text style={{ fontSize: 22, color, opacity: color === colors.primary ? 1 : 0.7 }}>{emoji}</Text>
);

const MainNavigator = () => {
  useThemedColors();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Início', tabBarIcon: tabIcon('🏠') }} />
      <Tab.Screen name="Jogos" component={EventsNavigator} options={{ tabBarIcon: tabIcon('🏟️') }} />
      <Tab.Screen name="Social" component={SocialNavigator} options={{ tabBarIcon: tabIcon('👥') }} />
      <Tab.Screen name="Perfil" component={ProfileNavigator} options={{ tabBarIcon: tabIcon('👤') }} />
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
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};
