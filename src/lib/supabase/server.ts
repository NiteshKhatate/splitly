import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always write cookies. Proxy refreshes them.
          }
        },
      },
    },
  );
}
