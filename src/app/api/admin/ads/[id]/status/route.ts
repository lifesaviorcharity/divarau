import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adId = parseInt(id);

    if (!adId) {
      return NextResponse.json({ error: "شناسه نامعتبر است" }, { status: 400 });
    }

    const { status, adminNote } = await request.json();

    if (!status) {
      return NextResponse.json({ error: "وضعیت نامعتبر است" }, { status: 400 });
    }

    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) {
      return NextResponse.json({ error: "آگهی یافت نشد" }, { status: 404 });
    }

    let nextStatus = status;

    // For all free ads (not COMMERCIAL), if they are APPROVED, they bypass PAID and go straight to FINAL
    if (status === "APPROVED") {
      if (ad.type !== "COMMERCIAL") {
        nextStatus = "FINAL";
      }
    }

    let expiresAt = ad.expiresAt;

    if (nextStatus === "FINAL" && ad.status !== "FINAL") {
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
      expiresAt = expiryDate;
    }

    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        status: nextStatus,
        adminNote: adminNote || null,
        ...(expiresAt ? { expiresAt } : {})
      }
    });

    return NextResponse.json({ success: true, ad: updatedAd });
  } catch (error) {
    console.error("Ad Status Update API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
