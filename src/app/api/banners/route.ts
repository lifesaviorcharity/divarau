import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Banners API Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت بنرها رخ داد." },
      { status: 500 }
    );
  }
}
