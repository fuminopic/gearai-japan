import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/lib/actions/auth";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return <AuthForm mode="signup" action={signUp} error={params.error} />;
}

