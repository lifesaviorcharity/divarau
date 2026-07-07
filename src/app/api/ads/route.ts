import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId");
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const type = searchParams.get("type"); // EMPLOYMENT, JOB_SEEKER, COMMERCIAL
    const status = searchParams.get("status") || "FINAL";
    const q = searchParams.get("q");

    const where: any = { status };

    if (cityId) where.cityId = parseInt(cityId);
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (subCategoryId) where.subCategoryId = parseInt(subCategoryId);
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { subCategory: { name: { contains: q, mode: 'insensitive' } } },
        { city: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const ads = await prisma.ad.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        city: true,
        category: true,
        subCategory: true,
      }
    });

    return NextResponse.json(ads);
  } catch (error) {
    console.error("Ads API Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت آگهی‌ها رخ داد." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "لطفاً ابتدا وارد شوید." }, { status: 401 });
    }

    const data = await request.json();
    
    const cityId = parseInt(data.cityId);
    const categoryId = parseInt(data.categoryId);
    const subCategoryId = parseInt(data.subCategoryId);

    if (!cityId || !categoryId || !subCategoryId || !data.title || !data.type) {
      return NextResponse.json({ error: "لطفا فیلدهای الزامی را پر کنید." }, { status: 400 });
    }

    // Enforce free ad limit if the ad is not a paid commercial ad
    if (data.type !== 'COMMERCIAL') {
      const freeAdLimitSetting = await prisma.systemSetting.findUnique({
        where: { key: 'freeAdLimit' }
      });
      const limit = freeAdLimitSetting ? parseInt(freeAdLimitSetting.value, 10) : 3;

      if (!isNaN(limit) && limit > 0) {
        const userFreeAdsCount = await prisma.ad.count({
          where: {
            userId: parseInt(session.user.id),
            type: { not: 'COMMERCIAL' },
            status: { notIn: ['REJECTED'] }
          }
        });

        if (userFreeAdsCount >= limit) {
          return NextResponse.json(
            {
              error: `شما به حداکثر مجاز ثبت آگهی رایگان (${limit} آگهی) رسیده‌اید. لطفاً جهت ثبت آگهی‌های بیشتر از بخش آگهی تجاری (پولی) استفاده کنید.`,
              code: "FREE_AD_LIMIT_REACHED"
            },
            { status: 403 }
          );
        }
      }
    }

    const ad = await prisma.ad.create({
      data: {
        userId: parseInt(session.user.id),
        cityId,
        categoryId,
        subCategoryId,
        type: data.type,
        title: data.title,
        description: data.description,
        status: 'PENDING',
      }
    });

    return NextResponse.json({ success: true, ad });
  } catch (error) {
    console.error("Ad Creation Error:", error);
    return NextResponse.json(
      { error: "خطایی در ثبت آگهی رخ داد." },
      { status: 500 }
    );
  }
}
