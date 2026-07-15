import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { isSupabaseConfigured, supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) return true;

  if (Platform.OS === "web") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/login" }
    });
    if (error) throw error;
    return false;
  }

  const redirectTo = Linking.createURL("auth/callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true }
  });
  if (error) throw error;
  if (!data.url) throw new Error("URL OAuth nao retornada.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return false;

  const url = new URL(result.url);
  const code = url.searchParams.get("code");
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      // a rota /auth/callback pode ter trocado o mesmo codigo primeiro
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw exchangeError;
    }
    return true;
  }

  // fallback: fluxo implicito (tokens no fragment #access_token=...)
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  const access_token = hashParams.get("access_token");
  const refresh_token = hashParams.get("refresh_token");
  if (access_token && refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sessionError) throw sessionError;
    return true;
  }

  const errDesc = url.searchParams.get("error_description") ?? hashParams.get("error_description");
  throw new Error(errDesc ?? "Codigo OAuth nao retornado.");
}

export async function hasActiveSession() {
  if (!isSupabaseConfigured) return true;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return Boolean(data.session);
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}
