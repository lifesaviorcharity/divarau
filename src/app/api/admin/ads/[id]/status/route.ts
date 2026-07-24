import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMessage } from "@/lib/twilio";

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

    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: { user: true }
    });

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

    // Fetch system settings
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    let expiresAt = ad.expiresAt;

    if (nextStatus === "FINAL" && ad.status !== "FINAL") {
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

    // Handle side effects (SMS, System Messages)
    const isSmsEnabled = settingsMap.smsNotify === "true" && settingsMap.userNotifyApproval === "true";

    if (nextStatus === "APPROVED" && ad.type === "COMMERCIAL") {
      const price = settingsMap.priceCommercialAd || "15";
      const messageBody = `کاربر گرامی، آگهی تجاری شما با عنوان "${ad.title}" تایید اولیه شد. جهت انتشار نهایی لطفاً مبلغ $${price} را پرداخت کنید.`;

      if (isSmsEnabled && ad.user?.mobile) {
        await sendMessage(ad.user.mobile, messageBody);
      }

      await prisma.message.create({
        data: {
          userId: ad.userId,
          title: "تایید اولیه آگهی تجاری",
          content: messageBody,
        }
      });
    } else if (nextStatus === "FINAL" && ad.status !== "FINAL") {
      const messageBody = `کاربر گرامی، آگهی شما با عنوان "${ad.title}" با موفقیت تایید و در سایت منتشر شد.`;

      if (isSmsEnabled && ad.user?.mobile) {
        await sendMessage(ad.user.mobile, messageBody);
      }

      await prisma.message.create({
        data: {
          userId: ad.userId,
          title: "تایید نهایی آگهی",
          content: messageBody,
        }
      });
    } else if (nextStatus === "NEEDS_EDIT") {
      const messageBody = `کاربر گرامی، آگهی شما با عنوان "${ad.title}" نیاز به اصلاح دارد. دلیل ادمین: ${adminNote || "عدم رعایت قوانین"}`;

      if (isSmsEnabled && ad.user?.mobile) {
        await sendMessage(ad.user.mobile, messageBody);
      }

      await prisma.message.create({
        data: {
          userId: ad.userId,
          title: "نیاز به اصلاح آگهی",
          content: messageBody,
        }
      });
    } else if (nextStatus === "REJECTED") {
      const messageBody = `کاربر گرامی، متأسفانه آگهی شما با عنوان "${ad.title}" رد شد. دلیل: ${adminNote || "عدم تایید توسط ناظر"}`;

      if (isSmsEnabled && ad.user?.mobile) {
        await sendMessage(ad.user.mobile, messageBody);
      }

      await prisma.message.create({
        data: {
          userId: ad.userId,
          title: "رد آگهی",
          content: messageBody,
        }
      });
    }

    return NextResponse.json({ success: true, ad: updatedAd });
  } catch (error) {
    console.error("Ad Status Update API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
