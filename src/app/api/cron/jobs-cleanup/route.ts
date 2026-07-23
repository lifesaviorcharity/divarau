import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // 48 hours ago
    const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Find jobs that are APPROVED (تایید اولیه) but their approvedAt was more than 48 hours ago
    const expiredJobs = await prisma.job.findMany({
      where: {
        status: "APPROVED",
        approvedAt: {
          lt: threshold
        }
      }
    });

    if (expiredJobs.length > 0) {
      const expiredJobIds = expiredJobs.map(job => job.id);
      
      // Delete or mark them as EXPIRED/REJECTED. Let's delete them as requested: "بصورت اتوماتیک توسط سیستم پاک می شود"
      await prisma.job.deleteMany({
        where: {
          id: { in: expiredJobIds }
        }
      });
      
      console.log(`Cron: Deleted ${expiredJobs.length} expired APPROVED jobs.`);
    }

    return NextResponse.json({ success: true, deletedCount: expiredJobs.length });
  } catch (error) {
    console.error("Cron Cleanup Error:", error);
    return NextResponse.json({ error: "خطا در پاکسازی" }, { status: 500 });
  }
}
