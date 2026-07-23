import prisma from "@/lib/prisma";
import CategoriesClient from "./CategoriesClient";

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await prisma.jobCategory.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      subCategories: {
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { jobs: true, ads: true }
          }
        }
      },
      _count: {
        select: { jobs: true, ads: true }
      }
    }
  });

  return <CategoriesClient initialCategories={categories} />;
}
