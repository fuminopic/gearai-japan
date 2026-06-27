import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { AppLoginRedirect } from "@/components/app-login-redirect";
import { signIn } from "@/lib/actions/auth";
import { headers } from "next/headers";

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
  const isNativeApp = userAgent.includes("YamajitakuApp");
  const isIosApp = params.app === "ios" || isNativeApp;

  // Inside the app, login lives on the bundled local page. Redirect server-side
  // (before any render) so the remote login never flashes. AppLoginRedirect
  // below is a client-side fallback for cases the UA isn't seen server-side.
  if (isNativeApp) {
    redirect("capacitor://localhost/");
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
