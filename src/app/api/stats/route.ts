import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [totalUsers, totalJobs, viewsAgg, reviewsAgg] = await Promise.all([
      prisma.user.count(),
      prisma.job.count({ where: { status: 'FINAL' } }),
      prisma.job.aggregate({ _sum: { viewCount: true } }),
      prisma.review.aggregate({ _avg: { rating: true }, where: { isApproved: true } })
    ]);

    const totalSearches = (viewsAgg._sum.viewCount || 0) + 3000; // Base 3000 + real views
    const rawAvg = reviewsAgg._avg.rating || 0;
    const satisfaction = Math.round((rawAvg / 5) * 100);

    return NextResponse.json({
      totalUsers,
      totalJobs,
      totalSearches,
      satisfaction
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت آمار رخ داد." },
      { status: 500 }
    );
  }
}
