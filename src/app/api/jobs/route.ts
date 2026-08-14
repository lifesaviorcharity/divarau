import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveJobImageToDisk } from "@/lib/jobImageStorage";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId");
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const statusParam = searchParams.get("status");
    let statusWhere: any;
    if (statusParam) {
      statusWhere = statusParam;
    } else {
      // By default for public website listing, include both FINAL and APPROVED jobs
      statusWhere = { in: ["FINAL", "APPROVED"] };
    }

    const isVip = searchParams.get("isVip");
    const q = searchParams.get("q");

    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "0"); // 0 means no limit (backward compat)

    const where: any = { status: statusWhere };

    if (cityId) where.cityId = parseInt(cityId);
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (subCategoryId) where.subCategoryId = parseInt(subCategoryId);
    if (isVip !== null) where.isVip = isVip === "true";
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { subCategory: { name: { contains: q, mode: 'insensitive' } } },
        { city: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const queryOptions: any = {
      where,
      orderBy: [
        { isBoosted: 'desc' }, // Boosted first
        { finalApprovedAt: 'desc' }, // Then by latest approval
        { id: 'desc' }, // Tie-breaker for deterministic sorting
      ],
      include: {
        city: true,
        category: true,
        subCategory: true,
        reviews: {
          where: { isApproved: true },
          select: { rating: true }
        }
      }
    };

    if (take > 0) {
      queryOptions.skip = skip;
      queryOptions.take = take;
      const [jobs, total] = await Promise.all([
        prisma.job.findMany(queryOptions),
        prisma.job.count({ where }),
      ]);
      return NextResponse.json({
        jobs,
        total,
        hasMore: skip + take < total,
      });
    }

    // Backward compatible: no pagination, return flat array
    const jobs = await prisma.job.findMany(queryOptions);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Jobs API Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت مشاغل رخ داد." },
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

    // Convert to numbers where appropriate
    const cityId = parseInt(data.cityId);
    const categoryId = parseInt(data.categoryId);
    const subCategoryId = parseInt(data.subCategoryId);

    if (!cityId || !categoryId || !subCategoryId || !data.title || !data.phone) {
      return NextResponse.json({ error: "لطفا فیلدهای الزامی را پر کنید." }, { status: 400 });
    }

    // Ensure userId is a number
    const userId = parseInt(session.user.id as string, 10);


    const job = await prisma.job.create({
      data: {
        userId: userId,
        cityId,
        categoryId,
        subCategoryId,
        title: data.title,
        description: data.description,
        phone: data.phone,
        address: data.address,
        website: data.website,
        instagram: data.instagram,
        telegram: data.telegram,
        whatsapp: data.whatsapp,
        workHours: data.workingHours,
        subscriptionType: data.subscriptionType || 'SIX_MONTHS',
        isVip: data.isVip || false,
        isBoosted: data.isBoosted || false,
        boostPeriod: data.boostPeriod,
        status: 'PENDING',
      }
    });

    // Save images if provided
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      const imageData = [];
      for (let idx = 0; idx < data.images.length; idx++) {
        const img = data.images[idx];
        const rawUrl = typeof img === "string" ? img : img.url;
        const savedUrl = await saveJobImageToDisk(rawUrl);
        imageData.push({
          jobId: job.id,
          url: savedUrl,
          isMain: typeof img === "object" && img.isMain !== undefined ? !!img.isMain : idx === 0,
          order: idx,
        });
      }
      await prisma.jobImage.createMany({ data: imageData });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Job Creation Error:", error);
    return NextResponse.json(
      { error: "خطایی در ثبت شغل رخ داد." },
      { status: 500 }
    );
  }
}
