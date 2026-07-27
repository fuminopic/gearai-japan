"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getProfileDetails,
  getStoredProfileAvatarPath,
  profileDetailsFromRow,
  profileDetailsSelect,
  type ProfileDetails,
  type ProfileDetailsRow
} from "@/lib/data/profile";
import {
  AGE_RANGE_OPTIONS,
  FAVORITE_REGION_OPTIONS,
  PROFILE_DETAILS_METADATA_VERSION,
  GENDER_OPTIONS,
  MOUNTAINEERING_EXPERIENCE_OPTIONS,
  MOUNTAINEERING_GENRE_OPTIONS,
  PROFILE_AVATAR_BUCKET,
  USUAL_TRIP_STYLE_OPTIONS,
  isProfileAvatarPath,
  type ProfileOption
} from "@/lib/profile-options";
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
  const isIosApp = await isIosAppRequest();
  await supabase.auth.signOut();
  redirect(isIosApp ? "/login?app=ios" : "/login");
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

  const storagePaths = await listUserStoragePaths(admin, "gear-images", user.id).catch((error) => {
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

  const profileAvatarPaths = await listUserStoragePaths(
    admin,
    PROFILE_AVATAR_BUCKET,
    user.id
  ).catch((error) => {
    if (isStorageBucketMissing(error)) {
      return [];
    }

    const message =
      error instanceof Error ? error.message : "プロフィール画像を確認できませんでした";
    redirect(`/profile?error=${encodeURIComponent(message)}`);
  });

  if (profileAvatarPaths.length > 0) {
    const { error: avatarStorageError } = await admin.storage
      .from(PROFILE_AVATAR_BUCKET)
      .remove(profileAvatarPaths);

    if (avatarStorageError) {
      redirect(`/profile?error=${encodeURIComponent(avatarStorageError.message)}`);
    }
  }

  // public.profiles.id references auth.users(id) with ON DELETE CASCADE. Keeping the
  // database cleanup inside the final Auth deletion avoids a live user without a profile
  // if the Auth admin API were to reject the last step.
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

export async function getOAuthSignInUrl(
  provider: "google" | "apple",
  app?: string,
  originOverride?: string
) {
  const supabase = await createClient();
  const origin = originOverride ?? (await getRequestOrigin());
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

export type ProfileActionState = {
  ok: boolean;
  message: string;
  profile?: ProfileDetails;
  displayName?: string;
};

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const displayName = cleanText(formData.get("display_name"), 40);
  const profileFields = parseProfileFields(formData);

  if (!profileFields.ok) {
    return profileFields;
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "ログイン状態を確認できませんでした。" };
  }

  const previousProfile = await getProfileDetails(supabase, user.id);
  if (!previousProfile) {
    return { ok: false, message: "プロフィールを読み込めませんでした。もう一度お試しください。" };
  }

  const { data: savedRow, error: profileError } = await supabase
    .from("profiles")
    .update({
      gender: profileFields.data.gender || null,
      age_range: profileFields.data.ageRange || null,
      mountaineering_experience: profileFields.data.mountaineeringExperience || null,
      mountaineering_genres: toSingleValueArray(profileFields.data.mountaineeringGenre),
      usual_trip_styles: toSingleValueArray(profileFields.data.usualTripStyle),
      favorite_regions: toSingleValueArray(profileFields.data.favoriteRegion)
    })
    .eq("id", user.id)
    .select(profileDetailsSelect)
    .single<ProfileDetailsRow>();

  if (profileError || !savedRow) {
    return { ok: false, message: "プロフィールを保存できませんでした。もう一度お試しください。" };
  }

  const savedProfile = profileDetailsFromRow(savedRow);

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
      // These legacy keys are a migration fallback only. Clear them after the
      // canonical profile row has been written so they cannot resurrect values.
      profile_gender: null,
      profile_age_range: null,
      mountaineering_experience: null,
      mountaineering_genres: null,
      usual_trip_styles: null,
      favorite_regions: null,
      profile_details_version: PROFILE_DETAILS_METADATA_VERSION
    }
  });

  if (metadataError) {
    await supabase
      .from("profiles")
      .update({
        gender: previousProfile.gender,
        age_range: previousProfile.ageRange,
        mountaineering_experience: previousProfile.mountaineeringExperience,
        mountaineering_genres: previousProfile.mountaineeringGenres,
        usual_trip_styles: previousProfile.usualTripStyles,
        favorite_regions: previousProfile.favoriteRegions
      })
      .eq("id", user.id);
    return { ok: false, message: "プロフィールを保存できませんでした。もう一度お試しください。" };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return {
    ok: true,
    message: "プロフィールを保存しました。",
    profile: savedProfile,
    displayName
  };
}

export async function saveProfileAvatar(path: string): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user || !isProfileAvatarPath(path, user.id)) {
    return { ok: false, message: "プロフィール画像を確認できませんでした。" };
  }

  const profile = await getProfileDetails(supabase, user.id);
  const previousPath = getStoredProfileAvatarPath(profile, user.id);
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_storage_path: path })
    .eq("id", user.id);

  if (profileError) {
    return { ok: false, message: "プロフィール画像を保存できませんでした。" };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: { profile_avatar_path: path }
  });

  if (updateError) {
    if (!profileError) {
      await supabase.from("profiles").update({ avatar_storage_path: previousPath || null }).eq("id", user.id);
    }
    return { ok: false, message: "プロフィール画像を保存できませんでした。" };
  }

  if (previousPath && previousPath !== path) {
    const { error: removeError } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .remove([previousPath]);

    if (removeError) {
      if (!profileError) {
        await supabase
          .from("profiles")
          .update({ avatar_storage_path: previousPath })
          .eq("id", user.id);
      }
      await supabase.auth.updateUser({
        data: { profile_avatar_path: previousPath }
      });
      await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([path]);
      return {
        ok: false,
        message: "以前のプロフィール画像を削除できませんでした。もう一度お試しください。"
      };
    }
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { ok: true, message: "プロフィール画像を更新しました。" };
}

export async function deleteProfileAvatar(): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "ログイン状態を確認できませんでした。" };
  }

  const profile = await getProfileDetails(supabase, user.id);
  const previousPath = getStoredProfileAvatarPath(profile, user.id);
  if (!previousPath) {
    return { ok: true, message: "プロフィール画像は設定されていません。" };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_storage_path: null })
    .eq("id", user.id);

  if (profileError) {
    return { ok: false, message: "プロフィール画像を削除できませんでした。" };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: { profile_avatar_path: null }
  });

  if (updateError) {
    if (!profileError) {
      await supabase
        .from("profiles")
        .update({ avatar_storage_path: previousPath })
        .eq("id", user.id);
    }
    return { ok: false, message: "プロフィール画像を削除できませんでした。" };
  }

  const { error: removeError } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .remove([previousPath]);

  if (removeError) {
    if (!profileError) {
      await supabase
        .from("profiles")
        .update({ avatar_storage_path: previousPath })
        .eq("id", user.id);
    }
    await supabase.auth.updateUser({
      data: { profile_avatar_path: previousPath }
    });
    return {
      ok: false,
      message: "プロフィール画像を削除できませんでした。もう一度お試しください。"
    };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { ok: true, message: "プロフィール画像を削除しました。" };
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
  redirect("/profile?saved=insurance" as Route);
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

function parseProfileFields(formData: FormData):
  | { ok: true; data: ProfileFields }
  | { ok: false; message: string } {
  const gender = readOptionalProfileOption(formData, "profile_gender", GENDER_OPTIONS);
  const ageRange = readOptionalProfileOption(formData, "profile_age_range", AGE_RANGE_OPTIONS);
  const mountaineeringExperience = readOptionalProfileOption(
    formData,
    "mountaineering_experience",
    MOUNTAINEERING_EXPERIENCE_OPTIONS
  );
  const mountaineeringGenre = readOptionalProfileOption(
    formData,
    "mountaineering_genres",
    MOUNTAINEERING_GENRE_OPTIONS
  );
  const usualTripStyle = readOptionalProfileOption(
    formData,
    "usual_trip_styles",
    USUAL_TRIP_STYLE_OPTIONS
  );
  const favoriteRegion = readOptionalProfileOption(
    formData,
    "favorite_regions",
    FAVORITE_REGION_OPTIONS
  );

  if (
    gender === null ||
    ageRange === null ||
    mountaineeringExperience === null ||
    mountaineeringGenre === null ||
    usualTripStyle === null ||
    favoriteRegion === null
  ) {
    return { ok: false, message: "選択内容を確認してから保存してください。" };
  }

  return {
    ok: true,
    data: {
      gender,
      ageRange,
      mountaineeringExperience,
      mountaineeringGenre,
      usualTripStyle,
      favoriteRegion
    }
  };
}

type ProfileFields = {
  gender: string;
  ageRange: string;
  mountaineeringExperience: string;
  mountaineeringGenre: string;
  usualTripStyle: string;
  favoriteRegion: string;
};

function readOptionalProfileOption(
  formData: FormData,
  name: string,
  options: readonly ProfileOption[]
) {
  const value = cleanText(formData.get(name), 40);
  return value === "" || options.some((option) => option.value === value) ? value : null;
}

function toSingleValueArray(value: string) {
  return value ? [value] : [];
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

async function listUserStoragePaths(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  userId: string
) {
  const paths: string[] = [];
  await collectStoragePaths(admin, bucket, userId, paths);

  return paths;
}

async function collectStoragePaths(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  directory: string,
  paths: string[]
) {
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(directory, { limit, offset });

    if (error) {
      throw error;
    }

    const entries = data ?? [];
    for (const entry of entries) {
      const path = `${directory}/${entry.name}`;
      if (entry.id) {
        paths.push(path);
      } else {
        await collectStoragePaths(admin, bucket, path, paths);
      }
    }

    if (entries.length < limit) {
      return;
    }

    offset += limit;
  }
}

function isStorageBucketMissing(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /bucket.*not found|not found.*bucket/i.test(message);
}
