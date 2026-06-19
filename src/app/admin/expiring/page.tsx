import prisma from "@/lib/prisma";
import ExpiringClient from "./ExpiringClient";

export const dynamic = 'force-dynamic';

export default async function AdminExpiringPage() {
  const now = new Date();
  
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const jobs = await prisma.job.findMany({
    where: {
      expiresAt: {
        gte: thirtyDaysAgo,
        lte: sevenDaysFromNow
      }
    },
    include: {
      user: true
    },
    orderBy: { expiresAt: "asc" }
  });

  const ads = await prisma.ad.findMany({
    where: {
      expiresAt: {
        gte: thirtyDaysAgo,
        lte: sevenDaysFromNow
      }
    },
    include: {
      user: true
    },
    orderBy: { expiresAt: "asc" }
  });

  // Normalize data for the client
  const items = [
    ...jobs.map(j => ({ id: j.id, type: 'job' as const, title: j.title, expiresAt: j.expiresAt, user: j.user.username || j.user.mobile, email: j.user.email })),
    ...ads.map(a => ({ id: a.id, type: 'ad' as const, title: a.title, expiresAt: a.expiresAt, user: a.user.username || a.user.mobile, email: a.user.email }))
  ].sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime());

  return <ExpiringClient initialItems={items} />;
}
