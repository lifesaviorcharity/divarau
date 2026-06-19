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
    const cityId = parseInt(id);

    const data = await request.json();
    const { name, slug, countryId } = data;

    if (!name || !slug || !countryId) {
      return NextResponse.json(
        { error: "لطفاً تمامی فیلدها را پر کنید." },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingCity = await prisma.city.findUnique({
      where: { slug }
    });

    if (existingCity && existingCity.id !== cityId) {
      return NextResponse.json(
        { error: "این نام انگلیسی (slug) قبلاً استفاده شده است." },
        { status: 400 }
      );
    }

    const updatedCity = await prisma.city.update({
      where: { id: cityId },
      data: {
        name,
        slug,
        countryId: parseInt(countryId)
      }
    });

    return NextResponse.json({ success: true, city: updatedCity });
  } catch (error) {
    console.error("Update City Error:", error);
    return NextResponse.json(
      { error: "خطایی در ویرایش شهر رخ داد." },
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
    const cityId = parseInt(id);

    // Check if there are jobs or ads associated
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      include: {
        _count: {
          select: { jobs: true, ads: true }
        }
      }
    });

    if (!city) {
      return NextResponse.json({ error: "شهر یافت نشد" }, { status: 404 });
    }

    if (city._count.jobs > 0 || city._count.ads > 0) {
      return NextResponse.json(
        { error: "این شهر دارای آگهی یا شغل است و نمی‌توان آن را حذف کرد." },
        { status: 400 }
      );
    }

    await prisma.city.delete({
      where: { id: cityId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete City Error:", error);
    return NextResponse.json(
      { error: "خطایی در حذف شهر رخ داد." },
      { status: 500 }
    );
  }
}
