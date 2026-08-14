import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveJobImageToDisk, deleteJobImageFile } from "@/lib/jobImageStorage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    
    if (!jobId) {
      return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        city: true,
        category: true,
        subCategory: true,
        images: { orderBy: { order: 'asc' } },
        user: {
          select: { username: true, mobile: true }
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { username: true } }
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: "شغل یافت نشد." }, { status: 404 });
    }

    const isFinal = job.status === "FINAL" || job.status === "PAID";
    const isApproved = job.status === "APPROVED";
    
    // If not final and not approved, only the owner or an admin can view it
    if (!isFinal && !isApproved) {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (job.userId !== parseInt(session.user.id) && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const reviewsEnabledSetting = await prisma.systemSetting.findUnique({
      where: { key: "reviews_enabled" }
    });
    const reviewsEnabled = reviewsEnabledSetting?.value !== "false";

    const reviewCount = job.reviews.length;
    const rating = reviewCount > 0 
      ? Math.round(job.reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviewCount) 
      : 0;

    return NextResponse.json({ ...job, reviewsEnabled, rating, reviewCount });
  } catch (error) {
    console.error("Job API Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت اطلاعات شغل رخ داد." },
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    
    if (!jobId) {
      return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
    }

    // Fetch images before deleting so we can clean up files
    const images = await prisma.jobImage.findMany({
      where: { jobId },
      select: { url: true },
    });

    // Delete image files from disk
    for (const img of images) {
      await deleteJobImageFile(img.url);
    }

    // Delete image records first (foreign key), then the job
    await prisma.jobImage.deleteMany({ where: { jobId } });

    const job = await prisma.job.delete({
      where: { id: jobId }
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Job Delete API Error:", error);
    return NextResponse.json(
      { error: "خطایی در حذف شغل رخ داد." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const jobId = parseInt(id);

    const body = await request.json();
    const {
      title,
      description,
      phone,
      address,
      email,
      website,
      whatsapp,
      telegram,
      instagram,
      workingHours,
      workHours,
      categoryId,
      subCategoryId,
      images,
    } = body;

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!existingJob) {
      return NextResponse.json({ error: "شغل یافت نشد." }, { status: 404 });
    }

    if (existingJob.userId !== parseInt(session.user.id) && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const isNeedsEditOrRejected = existingJob.status === "NEEDS_EDIT" || existingJob.status === "REJECTED";
    const updateData: any = {};

    if (isNeedsEditOrRejected) {
      // Full editing allowed for jobs needing correction
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (email !== undefined) updateData.email = email;
      if (website !== undefined) updateData.website = website;
      if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
      if (telegram !== undefined) updateData.telegram = telegram;
      if (instagram !== undefined) updateData.instagram = instagram;
      const finalWorkHours = workingHours !== undefined ? workingHours : workHours;
      if (finalWorkHours !== undefined) updateData.workHours = finalWorkHours;
      if (categoryId) updateData.categoryId = parseInt(categoryId);
      if (subCategoryId) updateData.subCategoryId = parseInt(subCategoryId);

      // Change status to PENDING for admin re-approval
      updateData.status = "PENDING";

      if (images && Array.isArray(images)) {
        // Delete old image files from disk
        const oldImages = await prisma.jobImage.findMany({
          where: { jobId },
          select: { url: true },
        });
        for (const oldImg of oldImages) {
          await deleteJobImageFile(oldImg.url);
        }

        await prisma.jobImage.deleteMany({ where: { jobId } });
        if (images.length > 0) {
          const imageData = [];
          for (let idx = 0; idx < images.length; idx++) {
            const img = images[idx];
            const rawUrl = typeof img === "string" ? img : img.url;
            const savedUrl = await saveJobImageToDisk(rawUrl);
            imageData.push({
              jobId,
              url: savedUrl,
              isMain: typeof img === "object" && img.isMain !== undefined ? !!img.isMain : idx === 0,
              order: idx,
            });
          }
          await prisma.jobImage.createMany({ data: imageData });
        }
      }
    } else {
      // Restricted editing for other statuses (FINAL, APPROVED): only Category and SubCategory
      if (categoryId) updateData.categoryId = parseInt(categoryId);
      if (subCategoryId) updateData.subCategoryId = parseInt(subCategoryId);
      // Status remains unchanged and no admin approval needed
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error("Job Update API Error:", error);
    return NextResponse.json(
      { error: "خطایی در ویرایش شغل رخ داد." },
      { status: 500 }
    );
  }
}
