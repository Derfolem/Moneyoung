import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { isSupabaseConfigured, supabase } from "../src/services/supabase";
import { hasActiveSession } from "../src/services/auth";
import { ToastHost } from "../src/components/Toast";

export default function Layout() {
  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.replace("/login");
      return;
    }

    hasActiveSession().then((active) => {
      if (!active) router.replace("/login");
    }).catch(() => router.replace("/login"));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <ToastHost />
    </View>
  );
}
