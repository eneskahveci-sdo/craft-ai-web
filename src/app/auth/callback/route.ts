import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Supabase magic-link / OAuth dönüşünde kodu oturuma çevirir. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(error.message)}`,
        );
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
