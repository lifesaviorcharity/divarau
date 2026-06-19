import prisma from "@/lib/prisma";
import JobsClient from "./JobsClient";

export default async function AdminJobsPage() {
  const jobs = await prisma.job.findMany({
    include: {
      user: true,
      city: true,
      category: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedJobs = jobs.map(j => ({
    id: j.id,
    title: j.title,
    user: j.user.username || j.user.mobile,
    city: j.city.name,
    category: j.category.name,
    status: j.status,
    createdAt: j.createdAt.toISOString()
  }));

  return <JobsClient initialJobs={formattedJobs} />;
}
