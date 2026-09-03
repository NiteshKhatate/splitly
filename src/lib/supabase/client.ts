import { createBrowserClient } from "@supabase/ssr";

import {
  getSupabaseBrowserPublishableKey,
  getSupabaseBrowserUrl,
} from "./env";

type BrowserClientOptions = {
  detectSessionInUrl?: boolean;
  isSingleton?: boolean;
};

export function createSupabaseBrowserClient(options?: BrowserClientOptions) {
  const supabaseUrl = getSupabaseBrowserUrl();
  const supabasePublishableKey = getSupabaseBrowserPublishableKey();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase browser environment variables are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  if (!options) {
    return createBrowserClient(supabaseUrl, supabasePublishableKey);
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey, {
    isSingleton: options.isSingleton,
    auth: {
      detectSessionInUrl: options.detectSessionInUrl,
    },
  });
}
