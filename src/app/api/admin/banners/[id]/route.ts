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
    const bannerId = parseInt(id);

    const body = await request.json();
    const { durationDays, link, position, displayDuration, isActive } = body;

    const banner = await prisma.banner.findUnique({
      where: { id: bannerId }
    });

    if (!banner) {
      return NextResponse.json({ error: "بنر یافت نشد" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (durationDays !== undefined) {
      dataToUpdate.durationDays = durationDays;
      dataToUpdate.expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    }
    if (link !== undefined) dataToUpdate.link = link;
    if (position !== undefined) dataToUpdate.position = position;
    if (displayDuration !== undefined) dataToUpdate.displayDuration = displayDuration;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    const updatedBanner = await prisma.banner.update({
      where: { id: bannerId },
      data: dataToUpdate
    });

    return NextResponse.json(updatedBanner);
  } catch (error) {
    console.error("Update Banner Error:", error);
    return NextResponse.json(
      { error: "خطایی در بروزرسانی بنر رخ داد." },
      { status: 500 }
    );
  }
}

