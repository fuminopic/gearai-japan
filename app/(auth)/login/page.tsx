import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/lib/actions/auth";

type LoginPageProps = {
  searchParams: Promise<{
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
      error={params.error}
      notice={params.deleted === "1" ? "アカウントが削除されました" : undefined}
      showEmailForm={params.email === "1"}
    />
  );
}
