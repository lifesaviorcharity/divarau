import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
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
    let { rating, comment } = body;

    rating = parseInt(rating);
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const isFinal = job.status === "FINAL" || job.status === "PAID";
    if (!isFinal) {
      return NextResponse.json({ error: "Cannot review a non-verified job" }, { status: 403 });
    }

    // Check system setting for parametric reviews
    const reviewsEnabledSetting = await prisma.systemSetting.findUnique({
      where: { key: "reviews_enabled" }
    });
    const reviewsEnabled = reviewsEnabledSetting?.value !== "false";

    let isApproved = false;
    
    // If text comments are disabled by admin, ignore the comment and auto-approve the rating
    if (!reviewsEnabled) {
      comment = null;
      isApproved = true;
    }

    const review = await prisma.review.create({
      data: {
        jobId,
        userId: parseInt(session.user.id),
        rating,
        comment,
        isApproved
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Job Review POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
