import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (!userId) {
      return NextResponse.json({ error: "شناسه نامعتبر است" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobs: {
          select: { id: true, title: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" }
        },
        ads: {
          select: { id: true, title: true, type: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin Get User Details Error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (!userId) {
      return NextResponse.json({ error: "شناسه نامعتبر است" }, { status: 400 });
    }

    const body = await request.json();
    const { isActive, role } = body;

    const updateData: any = {};
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (role === "ADMIN" || role === "USER") updateData.role = role;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Admin Update User Error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

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
    const userId = parseInt(id);
    if (!userId) {
      return NextResponse.json({ error: "شناسه نامعتبر است" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (session.user.id === String(userId)) {
      return NextResponse.json({ error: "شما نمی‌توانید حساب کاربری خود را حذف کنید." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Delete User Error:", error);
    return NextResponse.json({ error: "امکان حذف این کاربر به دلیل وابستگی اطلاعات وجود ندارد." }, { status: 500 });
  }
}
