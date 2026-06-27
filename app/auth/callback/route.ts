import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const accessToken = requestUrl.searchParams.get("access_token");
  const refreshToken = requestUrl.searchParams.get("refresh_token");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const isIosApp = requestUrl.searchParams.get("app") === "ios";
  // Only the bundled local-login binary appends local=1 on its handoff. We mark
  // it with a cookie so the remote /login knows to bounce back to the local
  // login page. The older remote-only App Store binary never sets this, so it
  // keeps its normal remote login and is unaffected by that behaviour.
  const isLocalApp = requestUrl.searchParams.get("local") === "1";
  const supabase = await createClient();

  const success = () => {
    const response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    if (isLocalApp) {
      response.cookies.set("yj_local_app", "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax"
      });
    }
    return response;
  };

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (!error) {
      return success();
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return success();
    }
  }

  // The PKCE code is single-use: a duplicate/repeated callback hit will fail to
  // exchange even though the session was already established. Treat an existing
  // valid session as success instead of surfacing a spurious error.
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) {
    return success();
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
