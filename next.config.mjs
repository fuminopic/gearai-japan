/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  experimental: {
    // クライアント側ルーターキャッシュの保持時間(秒)。
    //
    // 動的ルート(ホーム/ギア/計画/パック)は既定が 0 のため、タブを切り替える
    // たびにサーバーへ取り直しに行き、下部ナビの prefetch で先読みした分も
    // 即座に捨てられていた。30秒保持すると、戻ってきたときは取得済みの
    // ペイロードをそのまま使うので切り替えが待ち時間なしになる。
    //
    // 古いデータが残る心配は小さい: 装備・パック・計画の更新は server action
    // 側で revalidatePath("/dashboard" ほか) を必ず呼んでおり、書き込みの
    // たびにこのキャッシュも破棄される(src/lib/actions/*.ts)。
    staleTimes: {
      dynamic: 30,
      static: 180
    }
  },
  async headers() {
    return [
      {
        // service worker 不缓存,保证更新/止血能及时生效
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" }
        ]
      }
    ];
  }
};

export default nextConfig;
