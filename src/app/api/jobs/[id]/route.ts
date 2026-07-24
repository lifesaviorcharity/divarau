import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    
    // If not final, only the owner or an admin can view it
    if (!isFinal) {
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
    const { categoryId, subCategoryId } = body;

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!existingJob) {
      return NextResponse.json({ error: "شغل یافت نشد." }, { status: 404 });
    }

    if (existingJob.userId !== parseInt(session.user.id) && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update job but KEEP existing status if it is FINAL or APPROVED
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        categoryId: parseInt(categoryId),
        subCategoryId: parseInt(subCategoryId)
      }
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
