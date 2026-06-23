import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const isIosApp = requestUrl.searchParams.get("app") === "ios";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    }
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
