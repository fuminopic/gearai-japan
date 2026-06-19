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
  const mobilePhone = cleanText(formData.get("mobile_phone"), 32);
  const emergencyContactName = cleanText(formData.get("emergency_contact_name"), 40);
  const emergencyContactPhone = cleanText(formData.get("emergency_contact_phone"), 32);
  const mountainInsuranceStatus = cleanText(formData.get("mountain_insurance_status"), 16);
  const mountainInsuranceProvider = cleanText(formData.get("mountain_insurance_provider"), 80);
  const mountainInsuranceExpiresOn = cleanText(
    formData.get("mountain_insurance_expires_on"),
    10
  );
  const rescueServiceName = cleanText(formData.get("rescue_service_name"), 60);
  const rescueServiceMemberId = cleanText(formData.get("rescue_service_member_id"), 60);
  const homeArea = cleanText(formData.get("home_area"), 60);
  const defaultTripStyle = cleanText(formData.get("default_trip_style"), 24);
  const hikingExperience = cleanText(formData.get("hiking_experience"), 24);
  const hikingPace = cleanText(formData.get("hiking_pace"), 24);
  const gearPreferenceNote = cleanText(formData.get("gear_preference_note"), 180);

  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
      self_introduction: selfIntroduction,
      mobile_phone: mobilePhone,
      emergency_phone: mobilePhone,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      mountain_insurance_status: mountainInsuranceStatus,
      mountain_insurance_provider: mountainInsuranceProvider,
      mountain_insurance_expires_on: mountainInsuranceExpiresOn,
      rescue_service_name: rescueServiceName,
      rescue_service_member_id: rescueServiceMemberId,
      home_area: homeArea,
      default_trip_style: defaultTripStyle,
      hiking_experience: hikingExperience,
      hiking_pace: hikingPace,
      gear_preference_note: gearPreferenceNote
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
