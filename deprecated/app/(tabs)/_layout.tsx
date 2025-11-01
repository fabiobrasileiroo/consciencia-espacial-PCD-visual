import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
<<<<<<< HEAD:pdc-visual-app/app/(tabs)/_layout.tsx
=======
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/my-expo-app/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
>>>>>>> main:deprecated/app/(tabs)/_layout.tsx

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFF',
        tabBarInactiveTintColor: '#94A3B8', 
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
<<<<<<< HEAD:pdc-visual-app/app/(tabs)/_layout.tsx
          backgroundColor: '#262D45',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          marginTop: 0,
        },
        tabBarIconStyle: {
          display: 'none',
=======
          backgroundColor: '#1a1d2e',
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 40 : 15,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 90 : 90,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
>>>>>>> main:deprecated/app/(tabs)/_layout.tsx
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
<<<<<<< HEAD:pdc-visual-app/app/(tabs)/_layout.tsx
          title: 'Settings',
=======
          title: 'Configurações',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
      {/* <Tabs.Screen
        name="explore"
        options={{
          href: null, // Oculta da tab bar
>>>>>>> main:deprecated/app/(tabs)/_layout.tsx
        }}
      /> */}
    </Tabs>
  );
}