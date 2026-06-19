import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await prisma.jobCategory.findUnique({
      where: { name: data.name }
    });

    if (existing) {
      return NextResponse.json({ error: "این دسته‌بندی از قبل وجود دارد." }, { status: 400 });
    }

    const category = await prisma.jobCategory.create({
      data: {
        name: data.name,
        icon: data.icon || "📁",
        displayOrder: data.displayOrder || 0
      }
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Create Category Error:", error);
    return NextResponse.json(
      { error: "خطایی در ایجاد دسته‌بندی رخ داد." },
      { status: 500 }
    );
  }
}
