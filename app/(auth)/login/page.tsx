import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { AppLoginRedirect } from "@/components/app-login-redirect";
import { signIn } from "@/lib/actions/auth";
import { cookies, headers } from "next/headers";

type LoginPageProps = {
  searchParams: Promise<{
    app?: string;
    error?: string;
    deleted?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") ?? "";
  const isIosApp = params.app === "ios" || userAgent.includes("YamajitakuApp");

  // Only the bundled local-login binary carries this cookie (set in
  // /auth/callback on its handoff). Redirect it server-side, before any render,
  // so the remote login never flashes. We deliberately gate on the cookie, NOT
  // the user-agent: the old remote-only binary shares the UA but has no local
  // page to bounce to — redirecting it would strand it on a blank page.
  const cookieStore = await cookies();
  if (cookieStore.get("yj_local_app")?.value === "1") {
    redirect("capacitor://localhost/?login=1");
  }

  return (
    <>
      <AppLoginRedirect />
      <AuthForm
        mode="login"
        action={signIn}
        error={params.error}
        isIosApp={isIosApp}
        notice={params.deleted === "1" ? "アカウントが削除されました" : undefined}
        showEmailForm={params.email === "1"}
      />
    </>
  );
}
