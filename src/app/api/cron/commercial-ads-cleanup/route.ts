import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // 1. Fetch commercial ad duration setting
    const durationSetting = await prisma.systemSetting.findUnique({
      where: { key: "commercialAdDuration" }
    });
    
    // Default to 30 days if not set
    const durationDays = parseInt(durationSetting?.value || "30");
    
    // 2. Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - durationDays);

    // 3. Delete expired commercial ads (createdAt < cutoffDate)
    const result = await prisma.ad.deleteMany({
      where: {
        type: {
          in: ["COMMERCIAL", "COMMERCIAL_FREE"]
        },
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} expired commercial ads.`,
      cutoffDate,
      durationDays
    });
  } catch (error) {
    console.error("Cron - Commercial Ads Cleanup Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
