"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const isIosApp = String(formData.get("app") ?? "") === "ios";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    const params = new URLSearchParams({
      email: "1",
      error: getLoginErrorMessage(error.message)
    });
    if (isIosApp) {
      params.set("app", "ios");
    }
    redirect(`/login?${params.toString()}`);
  }

  redirect("/dashboard");
}

export async function signInWithGoogle() {
  await signInWithOAuthProvider("google");
}

export async function signInWithApple() {
  await signInWithOAuthProvider("apple");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const storagePaths = await listUserGearImagePaths(admin, user.id).catch((error) => {
    const message =
      error instanceof Error ? error.message : "アップロード画像を確認できませんでした";
    redirect(`/profile?error=${encodeURIComponent(message)}`);
  });

  if (storagePaths.length > 0) {
    const { error: storageError } = await admin.storage
      .from("gear-images")
      .remove(storagePaths);

    if (storageError) {
      redirect(`/profile?error=${encodeURIComponent(storageError.message)}`);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    redirect(`/profile?error=${encodeURIComponent(deleteError.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}

async function signInWithOAuthProvider(provider: "google" | "apple") {
  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const isIosApp = await isIosAppRequest();
  const callbackUrl = new URL(isIosApp ? "/auth/mobile-callback" : "/auth/callback", origin);
  callbackUrl.searchParams.set("next", "/dashboard");
  if (isIosApp) {
    callbackUrl.searchParams.set("app", "ios");
  }
  const redirectTo = callbackUrl.toString();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams: getOAuthQueryParams(provider)
    }
  });

  if (error) {
    redirect(`/login?email=1&error=${encodeURIComponent(error.message)}` as Route);
  }

  if (!data.url) {
    redirect(
      `/login?email=1&error=${encodeURIComponent("外部ログインを開始できませんでした")}` as Route
    );
  }

  redirect(data.url as Route);
}

export async function getOAuthSignInUrl(provider: "google" | "apple", app?: string) {
  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const isIosApp = app === "ios" || (await isIosAppRequest());
  const callbackUrl = new URL(isIosApp ? "/auth/mobile-callback" : "/auth/callback", origin);
  callbackUrl.searchParams.set("next", "/dashboard");
  if (isIosApp) {
    callbackUrl.searchParams.set("app", "ios");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: getOAuthQueryParams(provider),
      skipBrowserRedirect: true
    }
  });

  if (error || !data.url) {
    const params = new URLSearchParams({
      email: "1",
      error: error?.message ?? "外部ログインを開始できませんでした"
    });
    if (isIosApp) {
      params.set("app", "ios");
    }
    redirect(`/login?${params.toString()}` as Route);
  }

  return data.url;
}

function getOAuthQueryParams(provider: "google" | "apple") {
  if (provider === "google") {
    return {
      prompt: "select_account"
    };
  }

  return undefined;
}

async function isIosAppRequest() {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") ?? "";
  const referer = requestHeaders.get("referer");

  if (userAgent.includes("YamajitakuApp")) {
    return true;
  }

  if (!referer) {
    return false;
  }

  try {
    const refererUrl = new URL(referer);
    return refererUrl.searchParams.get("app") === "ios";
  } catch {
    return false;
  }
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (siteUrl) {
    return siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
  }

  return "http://localhost:3000";
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const displayName = cleanText(formData.get("display_name"), 40);
  const selfIntroduction = cleanText(formData.get("self_introduction"), 220);

  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
      self_introduction: selfIntroduction
    }
  });

  if (error) {
    redirect(`/profile/edit?error=${encodeURIComponent(error.message)}` as Route);
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  redirect("/profile");
}

export async function updateInsurance(formData: FormData) {
  const supabase = await createClient();
  const mountainInsuranceStatus = cleanText(formData.get("mountain_insurance_status"), 16);
  const mountainInsuranceProvider = cleanText(formData.get("mountain_insurance_provider"), 80);
  const mountainInsuranceStartsOn = cleanText(
    formData.get("mountain_insurance_starts_on"),
    10
  );
  const mountainInsuranceExpiresOn = cleanText(
    formData.get("mountain_insurance_expires_on"),
    10
  );
  const mountainInsurancePolicyNumber = cleanText(
    formData.get("mountain_insurance_policy_number"),
    80
  );

  const { error } = await supabase.auth.updateUser({
    data: {
      mountain_insurance_status: mountainInsuranceStatus,
      mountain_insurance_provider: mountainInsuranceProvider,
      mountain_insurance_starts_on: mountainInsuranceStartsOn,
      mountain_insurance_expires_on: mountainInsuranceExpiresOn,
      mountain_insurance_policy_number: mountainInsurancePolicyNumber
    }
  });

  if (error) {
    redirect(`/profile/insurance?error=${encodeURIComponent(error.message)}` as Route);
  }

  revalidatePath("/profile");
  revalidatePath("/profile/insurance");
  redirect("/profile");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 6) {
    redirect(
      `/profile/password?error=${encodeURIComponent("パスワードは6文字以上で入力してください")}` as Route
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/profile/password?error=${encodeURIComponent("確認用パスワードが一致しません")}` as Route
    );
  }

  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    redirect(`/profile/password?error=${encodeURIComponent(error.message)}` as Route);
  }

  revalidatePath("/profile");
  redirect("/profile/password?saved=1" as Route);
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function getLoginErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "メールアドレスまたはパスワードが正しくありません。Google / Appleで登録した場合は、下のボタンからログインしてください。";
  }

  return message;
}

async function listUserGearImagePaths(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const paths: string[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await admin.storage
      .from("gear-images")
      .list(userId, {
        limit,
        offset
      });

    if (error) {
      throw error;
    }

    const files = data ?? [];
    paths.push(...files.filter((file) => file.id).map((file) => `${userId}/${file.name}`));

    if (files.length < limit) {
      break;
    }

    offset += limit;
  }

  return paths;
}
