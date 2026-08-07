import prisma from "@/lib/prisma";
import JobsClient from "./JobsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminJobsPage() {
  const jobs = await prisma.job.findMany({
    include: {
      user: true,
      city: true,
      category: true,
      subCategory: true,
      images: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedJobs = jobs.map(j => ({
    id: j.id,
    title: j.title,
    user: j.user.username || j.user.mobile,
    userMobile: j.user.mobile,
    city: j.city.name,
    category: j.category.name,
    subCategory: j.subCategory?.name || "",
    status: j.status,
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
    expiresAt: j.expiresAt ? j.expiresAt.toISOString() : null,
    createdAt: j.createdAt.toISOString(),
    images: j.images.map(img => ({
      id: img.id,
      url: img.url,
      isMain: img.isMain,
      order: img.order,
    })),
  }));

  return <JobsClient initialJobs={formattedJobs} />;
}
