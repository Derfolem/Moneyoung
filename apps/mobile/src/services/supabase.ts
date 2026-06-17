import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigMessage =
  "Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env antes de usar o app.";

const secureAdapter = {
  getItem: async (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: async (key: string) => SecureStore.deleteItemAsync(key)
};

export const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseAnonKey || "local-development-anon-key",
  {
    auth: {
      storage: secureAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: { "x-youngcoin-client": "mobile" }
    }
  }
);

export const fallbackStorage = AsyncStorage;
