import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.jobCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        subCategories: {
          orderBy: { name: "asc" }
        }
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories API Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت لیست دسته‌بندی‌ها رخ داد." },
      { status: 500 }
    );
  }
}
