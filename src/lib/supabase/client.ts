import { createBrowserClient } from "@supabase/ssr";

import {
  getSupabaseBrowserPublishableKey,
  getSupabaseBrowserUrl,
} from "./env";

export function createSupabaseBrowserClient() {
  const supabaseUrl = getSupabaseBrowserUrl();
  const supabasePublishableKey = getSupabaseBrowserPublishableKey();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase browser environment variables are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
