import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, withSharedYamajitakuDomain(options, host));
          });
        } catch {
          // Server Components cannot set cookies; Server Actions can.
        }
      }
    }
  });
}

function withSharedYamajitakuDomain(
  options: Parameters<SetAllCookies>[0][number]["options"],
  host: string
) {
  if (!usesYamajitakuDomain(host)) {
    return options;
  }

  return {
    ...options,
    domain: ".yamajitaku.com",
    path: options.path ?? "/"
  };
}

function usesYamajitakuDomain(host: string) {
  return host === "yamajitaku.com" || host === "www.yamajitaku.com";
}
