import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// Resolve the landing destination in a single hop. Previously this always
// redirected to /dashboard, which then bounced unauthenticated users on to
// /login — three full navigations on a cold start. Deciding here removes the
// intermediate hop. getUser() (server-validated) is required rather than
// getSession(): a long-expired session still has a local cookie, so only a
// real validation routes a stale session straight to /login.
export default async function HomePage() {
  const supabase = await createClient();

  // Same hardening as requireUser: a transient getUser() failure (network drop /
  // token-refresh hiccup on WebView) must NOT bounce the user to /login. Retry
  // once, and only route to /login on a *confirmed* unauthenticated result.
  let result = await supabase.auth.getUser();
  if (result.error) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    result = await supabase.auth.getUser();
  }

  if (result.error) {
    // Still transient: defer to /dashboard, which is guarded by requireUser — it
    // retries and only routes to /login on a confirmed unauthenticated result.
    // (Never send a possibly-signed-in user to /login on a transient error.)
    redirect("/dashboard");
  }

  redirect(result.data.user ? "/dashboard" : "/login");
}
