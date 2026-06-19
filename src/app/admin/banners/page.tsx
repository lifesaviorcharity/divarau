import prisma from "@/lib/prisma";
import BannersClient from "./BannersClient";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const formattedBanners = banners.map(b => ({
    id: b.id,
    title: b.link ? b.link.substring(0, 20) : "بنر",
    position: b.position,
    status: b.isActive ? "ACTIVE" : "INACTIVE",
    createdAt: b.createdAt.toISOString()
  }));

  return <BannersClient initialBanners={formattedBanners} />;
}
