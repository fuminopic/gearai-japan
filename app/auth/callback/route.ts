import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const accessToken = requestUrl.searchParams.get("access_token");
  const refreshToken = requestUrl.searchParams.get("refresh_token");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const isIosApp = requestUrl.searchParams.get("app") === "ios";
  const supabase = await createClient();

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    }
  }

  // The PKCE code is single-use: a duplicate/repeated callback hit will fail to
  // exchange even though the session was already established. Treat an existing
  // valid session as success instead of surfacing a spurious error.
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) {
    return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  }

  const errorPath = `/login?email=1&error=${encodeURIComponent(
    "外部ログインを完了できませんでした"
  )}${isIosApp ? "&app=ios" : ""}`;
  return NextResponse.redirect(new URL(errorPath, requestUrl.origin));
}

function getSafeNextPath(next: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return "/dashboard";
}
