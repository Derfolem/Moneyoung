import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "../src/services/supabase";
import { hasActiveSession } from "../src/services/auth";

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

  return <Stack screenOptions={{ headerShown: false }} />;
}
