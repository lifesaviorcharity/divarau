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
    if (!data.name || !data.slug || !data.categoryId) {
      return NextResponse.json({ error: "Name, slug, and categoryId are required" }, { status: 400 });
    }

    const existing = await prisma.jobSubCategory.findUnique({
      where: { slug: data.slug }
    });

    if (existing) {
      return NextResponse.json({ error: "این نام انگلیسی (slug) از قبل وجود دارد." }, { status: 400 });
    }

    const subCategory = await prisma.jobSubCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        categoryId: parseInt(data.categoryId)
      }
    });

    return NextResponse.json({ success: true, subCategory });
  } catch (error) {
    console.error("Create SubCategory Error:", error);
    return NextResponse.json(
      { error: "خطایی در ایجاد زیردسته رخ داد." },
      { status: 500 }
    );
  }
}
