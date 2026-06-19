"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
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

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}
