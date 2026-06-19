import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adId = parseInt(id);

    const ad = await prisma.ad.findUnique({ where: { id: adId, userId: parseInt(session.user.id) } });
    if (!ad) {
      return NextResponse.json({ error: "آگهی یافت نشد" }, { status: 404 });
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    let durationDays = 10; // default
    if (ad.type === "COMMERCIAL" && settingsMap.commercialAdDuration) {
      durationDays = parseInt(settingsMap.commercialAdDuration);
    } else if (ad.type === "COMMERCIAL_FREE" && settingsMap.commercialFreeAdDuration) {
      durationDays = parseInt(settingsMap.commercialFreeAdDuration);
    } else if (ad.type === "EMPLOYMENT" && settingsMap.employmentAdDuration) {
      durationDays = parseInt(settingsMap.employmentAdDuration);
    } else if (ad.type === "JOB_SEEKER" && settingsMap.jobSeekerAdDuration) {
      durationDays = parseInt(settingsMap.jobSeekerAdDuration);
    }

    if (isNaN(durationDays) || durationDays <= 0) {
      durationDays = 10;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: { 
        status: "FINAL",
        expiresAt: expiryDate
      }
    });

    return NextResponse.json({ success: true, ad: updatedAd });
  } catch (error) {
    console.error("Pay Ad API Error:", error);
    return NextResponse.json(
      { error: "خطایی در پرداخت رخ داد." },
      { status: 500 }
    );
  }
}
