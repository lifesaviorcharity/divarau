import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "لطفاً ابتدا وارد شوید." }, { status: 401 });
    }

    const data = await request.json();
    const userId = parseInt(session.user.id as string, 10);

    const updateData: any = {};
    if (data.username !== undefined) updateData.username = data.username || null;
    if (data.email !== undefined) updateData.email = data.email || null;

    // Username duplicate check has been removed.

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "این نام قبلاً انتخاب شده است." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "خطایی در ذخیره اطلاعات پروفایل رخ داد." },
      { status: 500 }
    );
  }
}
