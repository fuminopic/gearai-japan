import { NextResponse } from "next/server";

import { getOAuthSignInUrl } from "@/lib/actions/auth";

type OAuthProvider = "google" | "apple";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL("/login?error=外部ログインを開始できませんでした", request.url));
  }

  const requestUrl = new URL(request.url);
  const signInUrl = await getOAuthSignInUrl(provider, requestUrl.searchParams.get("app") ?? undefined);

  return NextResponse.redirect(signInUrl);
}

function isOAuthProvider(provider: string): provider is OAuthProvider {
  return provider === "google" || provider === "apple";
}
