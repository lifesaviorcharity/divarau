import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import JobEditClient from "./JobEditClient";

export const dynamic = 'force-dynamic';

export default async function AdminJobEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = parseInt(id);

  if (isNaN(jobId)) {
    notFound();
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId }
  });

  if (!job) {
    notFound();
  }

  const categories = await prisma.jobCategory.findMany({
    include: { subCategories: true }
  });

  const cities = await prisma.city.findMany();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">ویرایش شغل: {job.title}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <JobEditClient job={job} categories={categories} cities={cities} />
      </div>
    </div>
  );
}
