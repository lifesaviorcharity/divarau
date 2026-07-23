import prisma from "@/lib/prisma";
import ExpiringClient from "./ExpiringClient";

export const dynamic = 'force-dynamic';

export default async function AdminExpiringPage() {
  const settings = await prisma.systemSetting.findUnique({
    where: { key: "expirationWarningDays" }
  });
  const warningDays = settings?.value ? parseInt(settings.value) : 7;
  const finalWarningDays = isNaN(warningDays) || warningDays <= 0 ? 7 : warningDays;

  const now = new Date();
  
  const thresholdFromNow = new Date();
  thresholdFromNow.setDate(now.getDate() + finalWarningDays);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const jobs = await prisma.job.findMany({
    where: {
      expiresAt: {
        gte: thirtyDaysAgo,
        lte: thresholdFromNow
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
        lte: thresholdFromNow
      }
    },
    include: {
      user: true
    },
    orderBy: { expiresAt: "asc" }
  });

  // Normalize data for the client
  const items = [
    ...jobs.map(j => ({ id: j.id, type: 'job' as const, title: j.title, expiresAt: j.expiresAt?.toISOString() || '', user: j.user.username || j.user.mobile || 'ناشناس', email: j.user.email })),
    ...ads.map(a => ({ id: a.id, type: 'ad' as const, title: a.title, expiresAt: a.expiresAt?.toISOString() || '', user: a.user.username || a.user.mobile || 'ناشناس', email: a.user.email }))
  ].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());

  return <ExpiringClient initialItems={items} />;
}
