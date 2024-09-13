import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAtomValue } from 'jotai';
import { credentialAtom } from '@/atoms';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const credential = useAtomValue(credentialAtom)

  if (!credential) {
    return <Redirect href="/auth-screen" />;
  }

  return <Redirect href="/driver-map" />;
}
