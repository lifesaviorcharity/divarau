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
    const adId = parseInt(id);

    const data = await request.json();

    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        title: data.title,
        description: data.description,
        cityId: data.cityId,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
      }
    });

    return NextResponse.json({ success: true, ad: updatedAd });
  } catch (error) {
    console.error("Ad Edit Error:", error);
    return NextResponse.json({ error: "خطایی در ویرایش آگهی رخ داد." }, { status: 500 });
  }
}
