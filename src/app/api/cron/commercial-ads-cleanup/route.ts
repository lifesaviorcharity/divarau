import { NextResponse } from "next/server";
import { runAdsCleanup } from "@/lib/cleanup";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const secretParam = searchParams.get("secret");
    const secret = process.env.CRON_SECRET;

    if (secret && secretParam !== secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runAdsCleanup();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron Ads Cleanup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
