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
const PUBLIC_ROUTES = new Set(['index', 'sign-in', 'sign-up', 'forgot-password']);

function LoadingScreen() {
  return <View style={{ flex: 1, backgroundColor: VoiceTheme.background }} />;
}

/**
 * Public: landing + auth screens.
 * Logged-in users skip the landing page and go to /home.
 * Logged-out users on protected routes go to the landing page.
 */
function AuthNavigationGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const root = typeof segments[0] === 'string' ? segments[0] : 'index';
  const onAuthScreen = AUTH_ROUTES.has(root);
  const onPublicScreen = PUBLIC_ROUTES.has(root);
  const onLanding = root === 'index';

  useEffect(() => {
    if (isLoading) return;

    if (user && (onLanding || onAuthScreen)) {
      console.log('[AuthGate] signed in — going to home');
      router.replace('/home' as Href);
      return;
    }

    if (!user && !onPublicScreen) {
      console.log('[AuthGate] no user — going to landing');
      router.replace('/' as Href);
    }
  }, [user, isLoading, onLanding, onAuthScreen, onPublicScreen, router]);

  if (isLoading) {
    return <LoadingScreen />;
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
          <Stack.Screen name="home" />
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
