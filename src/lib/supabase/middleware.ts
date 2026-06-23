import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, withSharedYamajitakuDomain(options));
        });
      }
    }
  });

  // Middleware only keeps auth cookies fresh; data loaders still verify users.
  await supabase.auth.getSession();

  return response;
}

function withSharedYamajitakuDomain(options: Parameters<SetAllCookies>[0][number]["options"]) {
  if (!usesYamajitakuDomain()) {
    return options;
  }

  return {
    ...options,
    domain: ".yamajitaku.com",
    path: options.path ?? "/"
  };
}

function usesYamajitakuDomain() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return Boolean(siteUrl?.includes("yamajitaku.com"));
}
