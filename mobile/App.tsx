import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './src/theme/colors';
import { loadToken, getToken } from './src/services/api';
import HomeScreen from './src/screens/HomeScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import ListsScreen from './src/screens/ListsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();

const GumpTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.headerBg,
    text: colors.text,
    border: colors.cardBorder,
    notification: colors.red,
  },
};

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    await loadToken();
    const token = await getToken();
    setAuthed(!!token);
  };

  if (authed === null) {
    return null; // splash/loading
  }

  if (!authed) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen onAuth={() => setAuthed(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer theme={GumpTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.headerBg,
              borderTopColor: colors.cardBorder,
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 88,
            },
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.tabInactive,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'home';
              switch (route.name) {
                case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
                case 'Discover': iconName = focused ? 'compass' : 'compass-outline'; break;
                case 'Lists': iconName = focused ? 'list' : 'list-outline'; break;
                case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
              }
              return <Ionicons name={iconName} size={24} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Discover" component={DiscoverScreen} />
          <Tab.Screen name="Lists" component={ListsScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
