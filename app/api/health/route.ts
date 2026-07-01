import { NextResponse } from "next/server";

// 服务器保活用的心跳接口。
// 不查数据库、不做鉴权、不读 Supabase —— 只是让 Vercel 的这个函数实例保持"热"。
// 外部定时服务(如 cron-job.org / UptimeRobot)每隔约 5 分钟 GET 一次这个地址即可,
// 免费额度就够用,不需要 Vercel Pro 的 Cron。
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { ok: true, ts: Date.now() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
