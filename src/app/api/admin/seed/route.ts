import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Create a dummy Country and City if not exists
    let country = await prisma.country.findFirst();
    if (!country) {
      country = await prisma.country.create({
        data: { name: "استرالیا", code: "AU", isDefault: true }
      });
    }

    let sydney = await prisma.city.findFirst({ where: { slug: "sydney" } });
    if (!sydney) {
      sydney = await prisma.city.create({
        data: { name: "سیدنی", slug: "sydney", countryId: country.id }
      });
    }

    let melbourne = await prisma.city.findFirst({ where: { slug: "melbourne" } });
    if (!melbourne) {
      melbourne = await prisma.city.create({
        data: { name: "ملبورن", slug: "melbourne", countryId: country.id }
      });
    }

    // 2. Create Dummy Categories
    let category1 = await prisma.jobCategory.findFirst({ where: { name: "پزشکی" } });
    if (!category1) {
      category1 = await prisma.jobCategory.create({
        data: { name: "پزشکی", icon: "🩺" }
      });
    }

    let subCat1 = await prisma.jobSubCategory.findFirst({ where: { slug: "dentist" } });
    if (!subCat1) {
      subCat1 = await prisma.jobSubCategory.create({
        data: { name: "دندانپزشک", slug: "dentist", categoryId: category1.id }
      });
    }

    // 3. Create Users from demo
    const demoUsers = [
      { mobile: "0412345678", username: "mohammadR", role: "USER", isActive: true },
      { mobile: "0432111222", username: "saraM", role: "USER", isActive: true },
      { mobile: "0451222333", username: "aliK", role: "USER", isActive: false },
      { mobile: "0400000000", username: "admin", role: "ADMIN", isActive: true },
    ];

    const createdUsers = [];
    for (const u of demoUsers) {
      let user = await prisma.user.findUnique({ where: { mobile: u.mobile } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            mobile: u.mobile,
            username: u.username,
            role: u.role as any,
            isActive: u.isActive
          }
        });
      }
      createdUsers.push(user);
    }

    // 4. Create Jobs from demo
    const demoJobs = [
      { title: "کلینیک دندانپزشکی پارس", status: "PENDING", userId: createdUsers[0].id, cityId: sydney.id },
      { title: "مطب دکتر احمدی", status: "APPROVED", userId: createdUsers[1].id, cityId: melbourne.id },
      { title: "رستوران شب‌نشین", status: "PAID", userId: createdUsers[2].id, cityId: sydney.id },
    ];

    for (const j of demoJobs) {
      const existing = await prisma.job.findFirst({ where: { title: j.title } });
      if (!existing) {
        await prisma.job.create({
          data: {
            title: j.title,
            description: "توضیحات پیش‌فرض برای این شغل...",
            status: j.status as any,
            userId: j.userId,
            cityId: j.cityId,
            categoryId: category1.id,
            subCategoryId: subCat1.id,
            subscriptionType: "SIX_MONTHS"
          }
        });
      }
    }

    // 5. Create Ads
    const demoAds = [
      { title: "استخدام برنامه‌نویس React", type: "EMPLOYMENT", status: "APPROVED", userId: createdUsers[0].id },
      { title: "جویای کار پاره‌رقت", type: "JOB_SEEKER", status: "PENDING", userId: createdUsers[1].id },
    ];

    for (const a of demoAds) {
      const existing = await prisma.ad.findFirst({ where: { title: a.title } });
      if (!existing) {
        await prisma.ad.create({
          data: {
            title: a.title,
            description: "توضیحات پیش‌فرض برای این آگهی...",
            type: a.type as any,
            status: a.status as any,
            userId: a.userId,
            cityId: sydney.id,
            categoryId: category1.id,
            subCategoryId: subCat1.id,
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully with admin demo data!" });
  } catch (error: any) {
    console.error("Seed error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
