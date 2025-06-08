// ✅ 수정된 (tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import BottomTabBar from '../../components/BottomTabBar';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// RecipeFilterProvider는 app/_layout.tsx로 이동
// import { RecipeFilterProvider } from '../../context/RecipeFilterContext'; 

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    // RecipeFilterProvider 제거 (app/_layout.tsx로 이동)
    // <RecipeFilterProvider>
      <Tabs
        tabBar={(props: BottomTabBarProps) => <BottomTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: { position: 'absolute' },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="myinfo"
          options={{
            title: '사용자',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle" color={color} />,
          }}
        />
      </Tabs>
    // </RecipeFilterProvider>
  );
}
