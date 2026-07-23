import prisma from "@/lib/prisma";
import AdsClient from "./AdsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAdsPage() {
  const ads = await prisma.ad.findMany({
    include: {
      user: true,
      city: true,
      category: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedAds = ads.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    user: a.user.username || a.user.mobile,
    city: a.city.name,
    category: a.category.name,
    type: a.type,
    status: a.status,
    adminNote: a.adminNote,
    createdAt: a.createdAt.toISOString()
  }));

  return <AdsClient initialAds={formattedAds} />;
}
