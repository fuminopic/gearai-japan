import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/lib/actions/auth";
import { headers } from "next/headers";

type SignupPageProps = {
  searchParams: Promise<{
    app?: string;
    error?: string;
    email?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const isIosApp = params.app === "ios" || requestHeaders.get("user-agent")?.includes("YamajitakuApp");

  return (
    <AuthForm
      mode="signup"
      action={signUp}
      error={params.error}
      isIosApp={isIosApp}
      showEmailForm={params.email === "1"}
    />
  );
}
