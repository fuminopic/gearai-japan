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
  const {
    data: { user }
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
