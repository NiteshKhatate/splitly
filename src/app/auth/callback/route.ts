import { NextResponse, type NextRequest } from "next/server";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error: profileError } = await ensureUserProfile(supabase, user);
        if (profileError) {
          console.warn("Supabase profile setup failed after confirmation", {
            code: profileError.code,
            message: profileError.message,
          });
        }
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("message", "We could not confirm your account. Please request a new confirmation email.");
  return NextResponse.redirect(loginUrl);
}
