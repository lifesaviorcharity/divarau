import { NextResponse } from "next/server";
import { runJobsCleanup, runAdsCleanup } from "@/lib/cleanup";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const secretParam = searchParams.get("secret");
    const secret = process.env.CRON_SECRET;

    if (secret && secretParam !== secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [jobsResult, adsResult] = await Promise.all([
      runJobsCleanup(),
      runAdsCleanup()
    ]);

    return NextResponse.json({
      success: true,
      jobs: jobsResult,
      ads: adsResult
    });
  } catch (error) {
    console.error("Master Cron Cleanup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
