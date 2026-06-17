import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { isSupabaseConfigured, supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) return true;
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
  if (!code) throw new Error("Codigo OAuth nao retornado.");

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
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
