import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveJobImageToDisk, deleteJobImageFile } from "@/lib/jobImageStorage";

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

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
    }

    const data = await request.json();

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!existingJob) {
      return NextResponse.json({ error: "شغل یافت نشد." }, { status: 404 });
    }

    const updateData: any = {
      title: data.title,
      description: data.description,
      phone: data.phone || null,
      address: data.address || null,
      email: data.email || null,
      website: data.website || null,
      whatsapp: data.whatsapp || null,
      telegram: data.telegram || null,
      instagram: data.instagram || null,
      workHours: data.workHours || null,
      cityId: parseInt(data.cityId),
      categoryId: parseInt(data.categoryId),
      subCategoryId: parseInt(data.subCategoryId),
    };

    if (data.status) updateData.status = data.status;
    if (data.subscriptionType) updateData.subscriptionType = data.subscriptionType;
    if (data.isVip !== undefined) updateData.isVip = Boolean(data.isVip);
    if (data.isBoosted !== undefined) updateData.isBoosted = Boolean(data.isBoosted);
    if (data.boostPeriod !== undefined) updateData.boostPeriod = data.boostPeriod || null;
    if (data.adminNote !== undefined) updateData.adminNote = data.adminNote || null;
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    // Handle images update
    if (data.images && Array.isArray(data.images)) {
      // Delete old image files from disk
      const oldImages = await prisma.jobImage.findMany({
        where: { jobId },
        select: { url: true },
      });
      for (const oldImg of oldImages) {
        await deleteJobImageFile(oldImg.url);
      }

      await prisma.jobImage.deleteMany({ where: { jobId } });
      if (data.images.length > 0) {
        const imageData = [];
        for (let idx = 0; idx < data.images.length; idx++) {
          const img = data.images[idx];
          const rawUrl = typeof img === "string" ? img : img.url;
          const savedUrl = await saveJobImageToDisk(rawUrl);
          imageData.push({
            jobId,
            url: savedUrl,
            isMain: typeof img === "object" && img.isMain !== undefined ? Boolean(img.isMain) : idx === 0,
            order: idx,
          });
        }
        await prisma.jobImage.createMany({ data: imageData });
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        images: { orderBy: { order: "asc" } },
        city: true,
        category: true,
        subCategory: true,
      }
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error("Admin Job Edit Error:", error);
    return NextResponse.json({ error: "خطایی در ویرایش شغل رخ داد." }, { status: 500 });
  }
}
