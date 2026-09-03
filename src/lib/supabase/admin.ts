import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "./env";
import { getSupabaseSecretKey } from "./server-env";

export function createSupabaseAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseSecretKey = getSupabaseSecretKey();

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
