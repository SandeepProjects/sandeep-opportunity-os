import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://wgormlhylsfssuapxyfb.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnb3JtbGh5bHNmc3N1YXB4eWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTc1NDYsImV4cCI6MjEwNzY3MzU0Nn0._yGvLGiUrWJW2Fe6Tj9U8Nn_OeKc5oz7cwRHuYZZYn4";

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

