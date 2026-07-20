import { DMSerifDisplay_400Regular, useFonts } from '@expo-google-fonts/dm-serif-display';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';

import { VoiceTheme } from '@/constants/voice-theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

SplashScreen.preventAutoHideAsync();

const AUTH_ROUTES = new Set(['sign-in', 'sign-up', 'forgot-password']);

function AuthNavigationGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const root = segments[0];
    const onAuthScreen = typeof root === 'string' && AUTH_ROUTES.has(root);

    if (!user && !onAuthScreen) {
      router.replace('/sign-in' as Href);
      return;
    }

    if (user && onAuthScreen) {
      router.replace('/' as Href);
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: VoiceTheme.background }} />;
  }

  return <>{children}</>;
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthNavigationGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: VoiceTheme.background },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen
            name="voice-settings"
            options={{
              animation: 'slide_from_right',
              gestureEnabled: true,
            }}
          />
        </Stack>
      </AuthNavigationGate>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
