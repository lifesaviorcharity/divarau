import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
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
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const images = await prisma.jobImage.findMany({
      where: { jobId },
      select: {
        id: true,
        url: true,
        isMain: true,
        order: true,
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Fetch Job Images Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
