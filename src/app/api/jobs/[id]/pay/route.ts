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

    const job = await prisma.job.update({
      where: { id: jobId, userId: parseInt(session.user.id) },
      data: { status: "FINAL" }
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
