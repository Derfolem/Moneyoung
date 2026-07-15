import { Stack, router, SplashScreen, usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { useFonts, JosefinSans_700Bold } from "@expo-google-fonts/josefin-sans";
import { isSupabaseConfigured, supabase } from "../src/services/supabase";
import { hasActiveSession } from "../src/services/auth";
import { ToastHost } from "../src/components/Toast";

SplashScreen.preventAutoHideAsync();

function hasPendingInvite(): boolean {
  if (Platform.OS !== "web") return false;
  try { return !!localStorage.getItem("myg_pending_invite"); } catch { return false; }
}

export default function Layout() {
  const [fontsLoaded] = useFonts({ JosefinSans_700Bold });
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;

    if (!isSupabaseConfigured) {
      router.replace("/login");
      return;
    }

    if (Platform.OS === "web" &&
      window.location.pathname === "/register" &&
      window.location.search.includes("invite_code")) {
      return;
    }

    const isOnLogin = Platform.OS === "web" && window.location.pathname === "/login";

    // rota /auth/* (callback OAuth) cuida da propria navegacao — nao interferir
    const onAuthRoute = () => pathRef.current?.startsWith("/auth");

    hasActiveSession().then(async (active) => {
      if (!active) { if (!onAuthRoute()) router.replace("/login"); return; }
      if (hasPendingInvite() || isOnLogin) return;
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) { router.replace("/login"); return; }
        const { data: profile } = await supabase
          .from("profiles")
          .select("status,account_type")
          .eq("id", session.session.user.id)
          .maybeSingle();
        if (profile?.status === "pending") router.replace("/pending-approval");
        else if (profile?.account_type === "sub_business") router.replace("/org-home");
      } catch {}
    }).catch(() => { if (!onAuthRoute()) router.replace("/login"); });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !onAuthRoute()) router.replace("/login");
    });
    return () => data.subscription.unsubscribe();
  }, [fontsLoaded]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <ToastHost />
    </View>
  );
}
