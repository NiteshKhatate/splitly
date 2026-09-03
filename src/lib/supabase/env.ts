export function getSupabaseUrl() {
  return process.env.NEXT_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function getSupabaseBrowserUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseBrowserPublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}
