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
  const emergencyPhone = cleanText(formData.get("emergency_phone"), 32);
  const residencePrefecture = cleanText(formData.get("residence_prefecture"), 40);
  const residenceCity = cleanText(formData.get("residence_city"), 60);
  const gender = cleanText(formData.get("gender"), 24);
  const birthDate = cleanText(formData.get("birth_date"), 10);
  const outdoorInterests = cleanText(formData.get("outdoor_interests"), 120);
  const occupation = cleanText(formData.get("occupation"), 60);
  const homepage = cleanText(formData.get("homepage"), 160);

  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
      self_introduction: selfIntroduction,
      emergency_phone: emergencyPhone,
      residence_prefecture: residencePrefecture,
      residence_city: residenceCity,
      gender,
      birth_date: birthDate,
      outdoor_interests: outdoorInterests,
      occupation,
      homepage
    }
  });

  if (error) {
    redirect(`/profile/edit?error=${encodeURIComponent(error.message)}` as Route);
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  redirect("/profile");
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}
