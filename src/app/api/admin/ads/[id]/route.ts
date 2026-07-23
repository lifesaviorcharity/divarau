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
    const adId = parseInt(id);

    if (!adId) {
      return NextResponse.json({ error: "شناسه نامعتبر است" }, { status: 400 });
    }

    // Remove adId from payments to avoid foreign key constraint error
    await prisma.payment.updateMany({
      where: { adId: adId },
      data: { adId: null }
    });

    await prisma.ad.delete({
      where: { id: adId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ad Delete API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
