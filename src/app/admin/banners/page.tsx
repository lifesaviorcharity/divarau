import prisma from "@/lib/prisma";
import BannersClient from "./BannersClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBannersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/banners");
  }

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
