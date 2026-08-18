import prisma from "@/lib/prisma";
import JobsClient from "./JobsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminJobsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/jobs");
  }

  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      phone: true,
      address: true,
      email: true,
      website: true,
      whatsapp: true,
      telegram: true,
      instagram: true,
      workHours: true,
      subscriptionType: true,
      isVip: true,
      isBoosted: true,
      boostPeriod: true,
      status: true,
      adminNote: true,
      expiresAt: true,
      createdAt: true,
      user: {
        select: {
          username: true,
          mobile: true,
        },
      },
      city: {
        select: {
          name: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      subCategory: {
        select: {
          name: true,
        },
      },
      _count: {
        select: { images: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedJobs = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    user: j.user.username || j.user.mobile,
    userMobile: j.user.mobile,
    city: j.city.name,
    category: j.category.name,
    subCategory: j.subCategory?.name || "",
    status: j.status,
    adminNote: j.adminNote || "",
    description: j.description,
    phone: j.phone,
    address: j.address,
    email: j.email,
    website: j.website,
    whatsapp: j.whatsapp,
    telegram: j.telegram,
    instagram: j.instagram,
    workHours: j.workHours,
    subscriptionType: j.subscriptionType,
    isVip: j.isVip,
    isBoosted: j.isBoosted,
    boostPeriod: j.boostPeriod,
    boostExpiresAt: (j as any).boostExpiresAt ? new Date((j as any).boostExpiresAt).toISOString() : null,
    expiresAt: j.expiresAt ? j.expiresAt.toISOString() : null,
    createdAt: j.createdAt.toISOString(),
    imageCount: j._count.images,
  }));

  return <JobsClient initialJobs={formattedJobs} />;
}
