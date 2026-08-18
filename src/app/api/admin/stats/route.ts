import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const [
      totalUsers,
      totalJobs,
      totalAds,
      pendingJobs,
      pendingAds,
      pendingReviews,
      openTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count({ where: { status: 'FINAL' } }),
      prisma.ad.count({ where: { status: 'FINAL' } }),
      prisma.job.count({ where: { status: 'PENDING' } }),
      prisma.ad.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.ticket.count({ where: { status: 'OPEN' } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalJobs,
      totalAds,
      pendingJobs,
      pendingAds,
      pendingReviews,
      openTickets,
    });
  } catch (error) {
    console.error("Admin Stats API Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت آمار رخ داد." },
      { status: 500 }
    );
  }
}
