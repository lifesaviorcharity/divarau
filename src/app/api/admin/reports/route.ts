import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { toJalali } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    const now = new Date();
    const startDate = new Date();
    const prevStartDate = new Date();

    if (period === "week") {
      startDate.setDate(now.getDate() - 7);
      prevStartDate.setDate(now.getDate() - 14);
    } else if (period === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
      prevStartDate.setFullYear(now.getFullYear() - 2);
    } else {
      // Default: month
      startDate.setMonth(now.getMonth() - 1);
      prevStartDate.setMonth(now.getMonth() - 2);
    }

    // 1. SUMMARY STATS (Current Period)
    const newJobs = await prisma.job.count({ where: { createdAt: { gte: startDate } } });
    const newAds = await prisma.ad.count({ where: { createdAt: { gte: startDate } } });
    const newUsers = await prisma.user.count({ where: { createdAt: { gte: startDate } } });
    
    const currentPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED", createdAt: { gte: startDate } }
    });
    const revenue = currentPayments._sum.amount || 0;

    // 1b. SUMMARY STATS (Previous Period for Trends)
    const prevJobs = await prisma.job.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } });
    const prevAds = await prisma.ad.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } });
    const prevUsers = await prisma.user.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } });
    
    const prevPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED", createdAt: { gte: prevStartDate, lt: startDate } }
    });
    const prevRevenue = prevPayments._sum.amount || 0;

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+۱۰۰٪" : "۰٪";
      const percent = Math.round(((curr - prev) / prev) * 100);
      const formatted = new Intl.NumberFormat('fa-IR').format(Math.abs(percent));
      return percent > 0 ? `+${formatted}٪` : `${percent < 0 ? '-' : ''}${formatted}٪`;
    };

    // 2. CITY STATS (All Time)
    const citiesData = await prisma.city.findMany({
      include: {
        _count: { select: { jobs: true, ads: true } }
      }
    });

    const cityStats = citiesData.map(c => ({
      city: c.name,
      jobs: c._count.jobs,
      ads: c._count.ads,
      users: 0 // Users are not directly linked to cities in schema
    })).sort((a, b) => (b.jobs + b.ads) - (a.jobs + a.ads));

    // 3. CATEGORY STATS (All Time)
    const totalJobs = await prisma.job.count();
    const categoriesData = await prisma.jobCategory.findMany({
      include: {
        _count: { select: { jobs: true } }
      }
    });

    const categoryStats = categoriesData
      .map(c => ({
        name: c.name,
        count: c._count.jobs,
        percent: totalJobs > 0 ? Math.round((c._count.jobs / totalJobs) * 100) : 0
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8

    // 4. CHART DATA (Grouped by time)
    // To keep it simple, we will fetch jobs and ads for the period and group them in JS
    const chartJobs = await prisma.job.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true }
    });
    
    const chartAds = await prisma.ad.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true }
    });

    const chartPayments = await prisma.payment.findMany({
      where: { status: "COMPLETED", createdAt: { gte: startDate } },
      select: { createdAt: true, amount: true }
    });

    // Bucket into 6 intervals depending on period
    let buckets: any[] = [];
    if (period === "week") {
      // 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(d);
        buckets.push({ label, date: d.toISOString().split('T')[0], jobs: 0, ads: 0, revenue: 0 });
      }
    } else if (period === "year") {
      // 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(d);
        buckets.push({ label, month: d.getMonth(), year: d.getFullYear(), jobs: 0, ads: 0, revenue: 0 });
      }
    } else {
      // Month: roughly 4 weeks (just split into 4 buckets or 30 days... let's do 4 weeks)
      for (let i = 3; i >= 0; i--) {
        buckets.push({ label: `هفته ${4 - i}`, weekIndex: i, jobs: 0, ads: 0, revenue: 0 });
      }
    }

    const getBucketIndex = (date: Date) => {
      if (period === "week") {
        const dateStr = date.toISOString().split('T')[0];
        return buckets.findIndex(b => b.date === dateStr);
      } else if (period === "year") {
        return buckets.findIndex(b => b.month === date.getMonth() && b.year === date.getFullYear());
      } else {
        // Month: week index based on how many days ago
        const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        const weekIdx = Math.floor(daysAgo / 7);
        if (weekIdx > 3) return 0; // oldest
        return 3 - weekIdx; // 3 is current week, 0 is oldest
      }
    };

    chartJobs.forEach(job => {
      const idx = getBucketIndex(new Date(job.createdAt));
      if (idx !== -1) buckets[idx].jobs++;
    });

    chartAds.forEach(ad => {
      const idx = getBucketIndex(new Date(ad.createdAt));
      if (idx !== -1) buckets[idx].ads++;
    });

    chartPayments.forEach(p => {
      const idx = getBucketIndex(new Date(p.createdAt));
      if (idx !== -1) buckets[idx].revenue += p.amount;
    });

    // Format final response
    return NextResponse.json({
      summary: {
        jobs: newJobs,
        ads: newAds,
        users: newUsers,
        revenue: revenue,
        jobTrend: calcTrend(newJobs, prevJobs),
        adTrend: calcTrend(newAds, prevAds),
        userTrend: calcTrend(newUsers, prevUsers),
        revenueTrend: calcTrend(revenue, prevRevenue)
      },
      cityStats,
      categoryStats,
      chartData: buckets.map(b => ({ label: b.label, jobs: b.jobs, ads: b.ads, revenue: b.revenue }))
    });

  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
