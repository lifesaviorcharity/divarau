import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const categoryId = parseInt(id);
    const data = await request.json();

    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await prisma.jobCategory.findFirst({
      where: { name: data.name, id: { not: categoryId } }
    });

    if (existing) {
      return NextResponse.json({ error: "این دسته‌بندی از قبل وجود دارد." }, { status: 400 });
    }

    const category = await prisma.jobCategory.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        icon: data.icon,
        displayOrder: data.displayOrder
      }
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Update Category Error:", error);
    return NextResponse.json(
      { error: "خطایی در بروزرسانی دسته‌بندی رخ داد." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const categoryId = parseInt(id);

    // Check if category has jobs or ads or subcategories with jobs/ads
    const category = await prisma.jobCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { jobs: true, ads: true, subCategories: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (category._count.jobs > 0 || category._count.ads > 0) {
      return NextResponse.json(
        { error: "نمی‌توانید این دسته‌بندی را حذف کنید زیرا شامل آگهی یا شغل است." },
        { status: 400 }
      );
    }

    // Since we can't easily cascade delete subcategories unless they are also empty,
    // let's just use Prisma to delete them if possible, or block if they have jobs.
    // Actually, checking if ANY subcategory has jobs/ads is safer.
    const subCategoriesInUse = await prisma.jobSubCategory.count({
      where: {
        categoryId,
        OR: [
          { jobs: { some: {} } },
          { ads: { some: {} } }
        ]
      }
    });

    if (subCategoriesInUse > 0) {
      return NextResponse.json(
        { error: "برخی از زیردسته‌های این گروه دارای آگهی یا شغل هستند." },
        { status: 400 }
      );
    }

    // Delete subcategories first
    await prisma.jobSubCategory.deleteMany({
      where: { categoryId }
    });

    await prisma.jobCategory.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Category Error:", error);
    return NextResponse.json(
      { error: "خطایی در حذف دسته‌بندی رخ داد." },
      { status: 500 }
    );
  }
}
