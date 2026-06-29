/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
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
