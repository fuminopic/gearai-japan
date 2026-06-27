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
  const isIosApp = params.app === "ios" || requestHeaders.get("user-agent")?.includes("YamajitakuApp");

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
