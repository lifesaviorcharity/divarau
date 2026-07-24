import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const origin = new URL(request.url).origin;

    const [jobsRes, adsRes] = await Promise.all([
      fetch(`${origin}/api/cron/jobs-cleanup`, { headers: request.headers }),
      fetch(`${origin}/api/cron/commercial-ads-cleanup`, { headers: request.headers })
    ]);

    const jobsData = await jobsRes.json();
    const adsData = await adsRes.json();

    return NextResponse.json({
      success: true,
      jobs: jobsData,
      ads: adsData
    });
  } catch (error) {
    console.error("Master Cron Cleanup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
