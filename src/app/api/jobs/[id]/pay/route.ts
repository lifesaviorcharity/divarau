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

    const jobRecord = await prisma.job.findUnique({ where: { id: jobId, userId: parseInt(session.user.id) } });
    if (!jobRecord) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const expiresAt = new Date();
    if (jobRecord.subscriptionType === "SIX_MONTHS") {
      expiresAt.setMonth(expiresAt.getMonth() + 6);
    } else if (jobRecord.subscriptionType === "TWELVE_MONTHS") {
      expiresAt.setMonth(expiresAt.getMonth() + 12);
    }

    const job = await prisma.job.update({
      where: { id: jobId, userId: parseInt(session.user.id) },
      data: { status: "FINAL", expiresAt }
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Pay Job API Error:", error);
    return NextResponse.json(
      { error: "خطایی در پرداخت رخ داد." },
      { status: 500 }
    );
  }
}
