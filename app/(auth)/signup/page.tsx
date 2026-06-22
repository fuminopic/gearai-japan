import { AuthForm } from "@/components/auth-form";
import { signInWithApple, signInWithGoogle, signUp } from "@/lib/actions/auth";

type SignupPageProps = {
  searchParams: Promise<{
    app?: string;
    error?: string;
    email?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <AuthForm
      mode="signup"
      action={signUp}
      appleAction={signInWithApple}
      googleAction={signInWithGoogle}
      error={params.error}
      isIosApp={params.app === "ios"}
      showEmailForm={params.email === "1"}
    />
  );
}
