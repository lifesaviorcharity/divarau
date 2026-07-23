import prisma from "@/lib/prisma";
import BannersClient from "./BannersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const formattedBanners = banners.map(b => ({
    id: b.id,
    title: b.link ? b.link.substring(0, 20) : "بنر",
    position: b.position,
    status: b.isActive ? "ACTIVE" : "INACTIVE",
    createdAt: b.createdAt.toISOString(),
    imageUrl: b.imageUrl,
    link: b.link,
    displayDuration: b.displayDuration
  }));

  return <BannersClient initialBanners={formattedBanners} />;
}
