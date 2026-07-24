import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const secretParam = searchParams.get("secret");
    const secret = process.env.CRON_SECRET;

    if (secret && secretParam !== secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const threshold48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // 1. Mark active jobs that reached expiresAt as EXPIRED
    const expiredByDate = await prisma.job.updateMany({
      where: {
        status: { in: ["FINAL", "PAID", "APPROVED"] },
        expiresAt: { lt: now }
      },
      data: {
        status: "EXPIRED"
      }
    });

    // 2. Delete initial APPROVED jobs that were never paid within 48 hours
    const unpaidJobs = await prisma.job.findMany({
      where: {
        status: "APPROVED",
        OR: [
          { approvedAt: { lt: threshold48h } },
          { approvedAt: null, createdAt: { lt: threshold48h } }
        ]
      }
    });

    let deletedUnpaidCount = 0;
    if (unpaidJobs.length > 0) {
      const unpaidJobIds = unpaidJobs.map(job => job.id);
      const res = await prisma.job.deleteMany({
        where: { id: { in: unpaidJobIds } }
      });
      deletedUnpaidCount = res.count;
    }

    return NextResponse.json({
      success: true,
      expiredJobsCount: expiredByDate.count,
      deletedUnpaidJobsCount: deletedUnpaidCount
    });
  } catch (error) {
    console.error("Cron Jobs Cleanup Error:", error);
    return NextResponse.json({ error: "خطا در پاکسازی مشاغل" }, { status: 500 });
  }
}
