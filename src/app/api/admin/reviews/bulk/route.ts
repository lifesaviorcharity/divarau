import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id } = await request.json();

    if (!type || !id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    let whereClause: any = { isApproved: true };

    if (type === "job") {
      whereClause.jobId = parseInt(id);
    } else if (type === "category") {
      whereClause.job = { categoryId: parseInt(id) };
    } else if (type === "subCategory") {
      whereClause.job = { subCategoryId: parseInt(id) };
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    await prisma.review.deleteMany({
      where: whereClause
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bulk deleting reviews:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
