import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/providers/AppProvider";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { auth, authLoaded } = useApp();
  const segments = useSegments();

  useEffect(() => {
    if (!authLoaded) return;

    const currentSegment = segments[0] as string;
    const inAuthGroup = currentSegment === 'auth' || currentSegment === 'verify-otp';
    const inOnboarding = currentSegment === 'onboarding';
    const inCompleteProfile = currentSegment === 'complete-profile';

    console.log('[Layout] Auth state:', JSON.stringify(auth));
    console.log('[Layout] Current segment:', segments[0]);

    if (!auth.isOnboarded) {
      router.replace('/onboarding' as any);
    } else if (!auth.isAuthenticated) {
      if (!inAuthGroup && !inOnboarding) {
        router.replace('/auth' as any);
      }
    } else if (!auth.isProfileComplete) {
      if (!inCompleteProfile && !inAuthGroup) {
        router.replace('/complete-profile' as any);
      }
    } else {
      if (inAuthGroup || inOnboarding || inCompleteProfile) {
        router.replace('/(tabs)/(home)' as any);
      }
    }
  }, [auth, authLoaded, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="auth" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="verify-otp" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="complete-profile" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen
        name="booking"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen name="tracking/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
