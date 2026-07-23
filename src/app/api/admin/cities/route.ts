import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
      include: {
        country: true,
        _count: {
          select: { jobs: true, ads: true }
        }
      }
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Fetch Cities Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت شهرها رخ داد." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { name, slug, countryId } = data;

    if (!name || !slug || !countryId) {
      return NextResponse.json(
        { error: "لطفاً تمامی فیلدها را پر کنید." },
        { status: 400 }
      );
    }

    const existingCity = await prisma.city.findUnique({
      where: { slug }
    });

    if (existingCity) {
      return NextResponse.json(
        { error: "این نام انگلیسی (slug) قبلاً استفاده شده است." },
        { status: 400 }
      );
    }

    const newCity = await prisma.city.create({
      data: {
        name,
        slug,
        countryId: parseInt(countryId)
      }
    });

    return NextResponse.json({ success: true, city: newCity });
  } catch (error) {
    console.error("Create City Error:", error);
    return NextResponse.json(
      { error: "خطایی در ایجاد شهر رخ داد." },
      { status: 500 }
    );
  }
}
