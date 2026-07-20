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

function LoadingScreen() {
  return <View style={{ flex: 1, backgroundColor: VoiceTheme.background }} />;
}

/**
 * Keeps the navigator mounted so redirects work, and sends logged-out users
 * to Sign In. Sync hooks must tolerate a null user (they no longer throw).
 */
function AuthNavigationGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const root = segments[0];
  const onAuthScreen = typeof root === 'string' && AUTH_ROUTES.has(root);

  useEffect(() => {
    if (isLoading) return;

    if (!user && !onAuthScreen) {
      console.log('[AuthGate] no user — redirecting to Sign In');
      router.replace('/sign-in' as Href);
      return;
    }

    if (user && onAuthScreen) {
      console.log('[AuthGate] signed in — redirecting to app');
      router.replace('/' as Href);
    }
  }, [user, isLoading, onAuthScreen, router]);

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
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="index" />
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
