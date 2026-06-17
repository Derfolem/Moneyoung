import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigMessage =
  "Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env antes de usar o app.";

const webAdapter = {
  getItem: async (key: string) => localStorage.getItem(key),
  setItem: async (key: string, value: string) => { localStorage.setItem(key, value); },
  removeItem: async (key: string) => { localStorage.removeItem(key); }
};

export const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseAnonKey || "local-development-anon-key",
  {
    auth: {
      storage: webAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: { "x-youngcoin-client": "mobile-web" }
    }
  }
);

export const fallbackStorage = {
  getItem: async (key: string) => localStorage.getItem(key),
  setItem: async (key: string, value: string) => { localStorage.setItem(key, value); },
  removeItem: async (key: string) => { localStorage.removeItem(key); }
};
