import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appCallbackUrl = new URL("yamajitaku://auth/callback");
  const code = requestUrl.searchParams.get("code");

  for (const [key, value] of requestUrl.searchParams.entries()) {
    appCallbackUrl.searchParams.set(key, value);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    appCallbackUrl.searchParams.delete("code");

    // The PKCE code is single-use. If this callback is hit twice, the second
    // exchange fails even though a session already exists — recover it instead
    // of handing the app a spurious error.
    const session =
      !error && data.session
        ? data.session
        : (await supabase.auth.getSession()).data.session;

    if (session) {
      appCallbackUrl.searchParams.set("access_token", session.access_token);
      appCallbackUrl.searchParams.set("refresh_token", session.refresh_token);
    } else {
      appCallbackUrl.searchParams.set("error", "外部ログインを完了できませんでした");
    }
  }

  if (!appCallbackUrl.searchParams.has("next")) {
    appCallbackUrl.searchParams.set("next", "/dashboard");
  }
  appCallbackUrl.searchParams.set("app", "ios");

  return new NextResponse(
    `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>山支度へ戻ります</title>
    <meta http-equiv="refresh" content="0;url=${escapeHtml(appCallbackUrl.toString())}" />
    <style>
      body {
        align-items: center;
        background: #ffffff;
        color: #14211b;
        display: flex;
        font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
      }
      main {
        max-width: 320px;
        padding: 24px;
        text-align: center;
      }
      a {
        color: #14724e;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main>
      <p>山支度アプリへ戻ります。</p>
      <p><a href="${escapeHtml(appCallbackUrl.toString())}">自動で戻らない場合はこちら</a></p>
    </main>
    <script>
      window.location.replace(${JSON.stringify(appCallbackUrl.toString())});
    </script>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8"
      }
    }
  );
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}
