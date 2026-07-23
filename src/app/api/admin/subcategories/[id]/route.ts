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
    const subCategoryId = parseInt(id);
    const data = await request.json();

    if (!data.name || !data.slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const existing = await prisma.jobSubCategory.findFirst({
      where: { slug: data.slug, id: { not: subCategoryId } }
    });

    if (existing) {
      return NextResponse.json({ error: "این نام انگلیسی (slug) از قبل وجود دارد." }, { status: 400 });
    }

    const subCategory = await prisma.jobSubCategory.update({
      where: { id: subCategoryId },
      data: {
        name: data.name,
        slug: data.slug
      }
    });

    return NextResponse.json({ success: true, subCategory });
  } catch (error) {
    console.error("Update SubCategory Error:", error);
    return NextResponse.json(
      { error: "خطایی در بروزرسانی زیردسته رخ داد." },
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
    const subCategoryId = parseInt(id);

    const subCategory = await prisma.jobSubCategory.findUnique({
      where: { id: subCategoryId },
      include: {
        _count: {
          select: { jobs: true, ads: true }
        }
      }
    });

    if (!subCategory) {
      return NextResponse.json({ error: "SubCategory not found" }, { status: 404 });
    }

    if (subCategory._count.jobs > 0 || subCategory._count.ads > 0) {
      return NextResponse.json(
        { error: "نمی‌توانید این زیردسته را حذف کنید زیرا شامل آگهی یا شغل است." },
        { status: 400 }
      );
    }

    await prisma.jobSubCategory.delete({
      where: { id: subCategoryId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete SubCategory Error:", error);
    return NextResponse.json(
      { error: "خطایی در حذف زیردسته رخ داد." },
      { status: 500 }
    );
  }
}
