import { redirect } from "next/navigation";

import { getUserWithAuthRetry } from "@/lib/auth-validation";
import { createClient } from "@/lib/supabase/server";

// Resolve the landing destination in a single hop. Previously this always
// redirected to /dashboard, which then bounced unauthenticated users on to
// /login — three full navigations on a cold start. Deciding here removes the
// intermediate hop. getUser() (server-validated) is required rather than
// getSession(): a long-expired session still has a local cookie, so only a
// real validation routes a stale session straight to /login.
export default async function HomePage() {
  const supabase = await createClient();

  const result = await getUserWithAuthRetry(supabase);

  if (result.kind === "transient_error") {
    // Still transient: defer to /dashboard, which is guarded by requireUser — it
    // retries and either renders a recoverable error or routes to /login on a
    // confirmed unauthenticated result.
    // (Never send a possibly-signed-in user to /login on a transient error.)
    redirect("/dashboard");
  }

  redirect(result.kind === "authenticated" ? "/dashboard" : "/login");
}
