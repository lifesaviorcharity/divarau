import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
      include: {
        country: true
      }
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Cities API Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت لیست شهرها رخ داد." },
      { status: 500 }
    );
  }
}
