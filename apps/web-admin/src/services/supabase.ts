"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigMessage =
  "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env antes de acessar o painel.";

export const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseAnonKey || "local-development-anon-key",
  {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { headers: { "x-youngcoin-client": "web-admin" } }
  }
);
