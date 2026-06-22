import { AuthForm } from "@/components/auth-form";
import { signIn, signInWithApple, signInWithGoogle } from "@/lib/actions/auth";

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

  return (
    <AuthForm
      mode="login"
      action={signIn}
      appleAction={signInWithApple}
      googleAction={signInWithGoogle}
      error={params.error}
      isIosApp={params.app === "ios"}
      notice={params.deleted === "1" ? "アカウントが削除されました" : undefined}
      showEmailForm={params.email === "1"}
    />
  );
}
