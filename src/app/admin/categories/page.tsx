import prisma from "@/lib/prisma";
import CategoriesClient from "./CategoriesClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/categories");
  }

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
