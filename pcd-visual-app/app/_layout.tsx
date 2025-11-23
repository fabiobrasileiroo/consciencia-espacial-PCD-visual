import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/contexts/AppContext';

// Impedir que o splash nativo seja escondido automaticamente
SplashScreen.preventAutoHideAsync().catch(() => { });

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Simular carregamento inicial (pode ser substituído por carregamento real de fonts, dados, etc.)
    setTimeout(() => setIsReady(true), 300);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Animação: fade in → pause → fade out
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(async () => {
      // Após animação, esconder splash nativo e mostrar app
      await SplashScreen.hideAsync();
      setShowSplash(false);
    });
  }, [isReady]);

  // Enquanto o splash está sendo exibido, mostrar a animação
  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#141A2D', justifyContent: 'center', alignItems: 'center' }}>
        <Animated.Image
          source={require('@/assets/images/splash-icon.png')}
          style={{ width: 180, height: 180, opacity }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Depois do splash, renderizar o app normal
  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppProvider>
  );
}