import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import AdEditClient from "./AdEditClient";

export const dynamic = 'force-dynamic';

export default async function AdminAdEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adId = parseInt(id);

  if (isNaN(adId)) {
    notFound();
  }

  const ad = await prisma.ad.findUnique({
    where: { id: adId }
  });

  if (!ad) {
    notFound();
  }

  const categories = await prisma.jobCategory.findMany({
    include: { subCategories: true }
  });

  const cities = await prisma.city.findMany();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">ویرایش آگهی: {ad.title}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <AdEditClient ad={ad} categories={categories} cities={cities} />
      </div>
    </div>
  );
}
