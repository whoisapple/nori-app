import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StatusBar } from 'expo-status-bar';
import { initializeGoogleMobileAds } from '@/lib/ads';
import { getOnboardingComplete } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  React.useEffect(() => {
    void initializeGoogleMobileAds();
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const isComplete = await getOnboardingComplete();
      if (!mounted) return;

      if (!isComplete) {
        router.replace('/onboarding');
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!data.session) {
        router.replace('/login');
      }
    }

    void bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="dark" backgroundColor="#f2f2fc" />
        <Stack screenOptions={{ headerShown: false, animation: 'none', gestureEnabled: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="category" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="paywall" />
          <Stack.Screen name="article/[id]" />
          <Stack.Screen name="briefing" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
