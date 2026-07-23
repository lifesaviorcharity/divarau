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
    const jobId = parseInt(id);

    const data = await request.json();

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: data.title,
        description: data.description,
        phone: data.phone,
        address: data.address,
        email: data.email,
        website: data.website,
        whatsapp: data.whatsapp,
        telegram: data.telegram,
        instagram: data.instagram,
        workHours: data.workHours,
        cityId: data.cityId,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
      }
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error("Job Edit Error:", error);
    return NextResponse.json({ error: "خطایی در ویرایش شغل رخ داد." }, { status: 500 });
  }
}
