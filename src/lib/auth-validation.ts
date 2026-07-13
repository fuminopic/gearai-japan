import type { AuthError, User } from "@supabase/supabase-js";

type AuthClientWithUser = {
  auth: {
    getUser: () => Promise<{
      data: {
        user: User | null;
      };
      error: AuthError | null;
    }>;
  };
};

export type AuthUserResult =
  | {
      kind: "authenticated";
      user: User;
    }
  | {
      kind: "unauthenticated";
    }
  | {
      kind: "transient_error";
      message: string;
    };

export async function getUserWithAuthRetry(
  supabase: AuthClientWithUser
): Promise<AuthUserResult> {
  let result = await supabase.auth.getUser();

  if (result.error && classifyAuthUserError(result.error) === "transient") {
    await new Promise((resolve) => setTimeout(resolve, 400));
    result = await supabase.auth.getUser();
  }

  if (result.error) {
    const classification = classifyAuthUserError(result.error);
    if (classification === "unauthenticated") {
      return { kind: "unauthenticated" };
    }

    return {
      kind: "transient_error",
      message: result.error.message
    };
  }

  if (!result.data.user) {
    return { kind: "unauthenticated" };
  }

  return {
    kind: "authenticated",
    user: result.data.user
  };
}

export function classifyAuthUserError(error: unknown): "unauthenticated" | "transient" {
  const name = normalizeAuthErrorField(readAuthErrorField(error, "name"));
  const code = normalizeAuthErrorField(readAuthErrorField(error, "code"));
  const message = normalizeAuthErrorField(readAuthErrorField(error, "message"));
  const status = readAuthErrorStatus(error);

  if (
    name.includes("authsessionmissing") ||
    code.includes("session not found") ||
    code.includes("sessionmissing") ||
    message.includes("auth session missing") ||
    message.includes("session missing") ||
    message.includes("no session")
  ) {
    return "unauthenticated";
  }

  if (
    code.includes("invalid token") ||
    code.includes("invalid grant") ||
    code.includes("bad jwt") ||
    code.includes("refresh token not found") ||
    code.includes("refresh token already used") ||
    code.includes("session expired") ||
    message.includes("jwt expired") ||
    message.includes("invalid jwt") ||
    message.includes("invalid token") ||
    message.includes("refresh token") ||
    message.includes("expired")
  ) {
    return "unauthenticated";
  }

  if (status === 400 || status === 401 || status === 403) {
    return "unauthenticated";
  }

  if (
    status === 429 ||
    (typeof status === "number" && status >= 500) ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("econnreset") ||
    message.includes("temporarily unavailable")
  ) {
    return "transient";
  }

  return "transient";
}

function readAuthErrorField(error: unknown, field: "name" | "code" | "message") {
  if (!error || typeof error !== "object" || !(field in error)) {
    return "";
  }

  const value = (error as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}

function readAuthErrorStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return undefined;
  }

  const value = (error as Record<string, unknown>).status;
  return typeof value === "number" ? value : undefined;
}

function normalizeAuthErrorField(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, " ");
}
