import { Stack } from "expo-router";
// @ts-ignore: allow importing global css side-effect without type declarations
import "../../global.css";

import React from "react";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  // const { colorScheme, setColorScheme } = useColorScheme();
  return (
    // <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
    // <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
    // </ThemeProvider>
    // <React.Fragment>
    //   <StatusBar style="auto" />
    //   <Stack />
    // </React.Fragment>
  );
}
