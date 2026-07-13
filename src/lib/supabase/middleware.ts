import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { classifyAuthUserError } from "@/lib/auth-validation";

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
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  // Middleware only keeps auth cookies fresh; data loaders still verify users.
  try {
    const { error } = await supabase.auth.getSession();
    if (error && classifyAuthUserError(error) === "unauthenticated") {
      return clearSupabaseAuthCookiesAndRedirectToLogin(request);
    }
  } catch (caught) {
    if (classifyAuthUserError(caught) === "unauthenticated") {
      return clearSupabaseAuthCookiesAndRedirectToLogin(request);
    }
  }

  return response;
}

function clearSupabaseAuthCookiesAndRedirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  for (const cookie of request.cookies.getAll()) {
    if (!isSupabaseAuthCookie(cookie.name)) {
      continue;
    }

    request.cookies.delete(cookie.name);
    response.cookies.set(cookie.name, "", {
      maxAge: 0,
      path: "/"
    });
  }

  return response;
}

function isSupabaseAuthCookie(name: string) {
  return name.startsWith("sb-");
}
