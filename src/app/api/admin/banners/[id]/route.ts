import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bannerId = parseInt(id);

    await prisma.banner.delete({
      where: { id: bannerId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Banner Error:", error);
    return NextResponse.json(
      { error: "خطایی در حذف بنر رخ داد." },
      { status: 500 }
    );
  }
}
