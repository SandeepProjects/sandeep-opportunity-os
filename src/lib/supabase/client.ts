import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://wgormlhylsfssuapxyfb.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_hrvoevZCWx3ETho4lGZX_A_6ZbShZXV";

const envUrl =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_URL as string | undefined)
    : undefined;

const envAnonKey =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
    : undefined;

export const supabaseUrl = envUrl && !envUrl.includes("your-project-ref") ? envUrl : DEFAULT_SUPABASE_URL;
export const supabaseAnonKey =
  envAnonKey && !envAnonKey.includes("placeholder") ? envAnonKey : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("your-project-ref")
);

export const supabaseClient: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

