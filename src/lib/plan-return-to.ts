import type { Route } from "next";

const INTERNAL_ORIGIN = "https://yamajitaku.invalid";

export function getPlanReturnTo(value?: string | null): Route | null {
  if (!value || !value.startsWith("/")) {
    return null;
  }

  try {
    const url = new URL(value, INTERNAL_ORIGIN);

    if (url.origin !== INTERNAL_ORIGIN || url.pathname !== "/plan") {
      return null;
    }

    return `${url.pathname}${url.search}` as Route;
  } catch {
    return null;
  }
}

export function buildGearHref(path: string = "/gear", returnTo?: string | null): Route {
  const safeReturnTo = getPlanReturnTo(returnTo);

  if (!safeReturnTo) {
    return path as Route;
  }

  const url = new URL(path, INTERNAL_ORIGIN);
  url.searchParams.set("returnTo", safeReturnTo);

  return `${url.pathname}${url.search}` as Route;
}

export function getCurrentPlanReturnTo(pathname: string, query: string): Route | null {
  if (pathname !== "/plan") {
    return null;
  }

  return `${pathname}${query ? `?${query}` : ""}` as Route;
}
