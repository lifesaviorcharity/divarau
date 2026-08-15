import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMessage } from "@/lib/twilio";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const jobId = parseInt(id);
    const data = await request.json();
    const { status, adminNote } = data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { user: true }
    });

    if (!job) {
      return NextResponse.json({ error: "شغل پیدا نشد." }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = { status, adminNote };

    if (status === "APPROVED") {
      updateData.approvedAt = new Date();
    } else if (status === "PENDING") {
      updateData.approvedAt = null;
      updateData.finalApprovedAt = null;
    } else if (status === "FINAL") {
      updateData.finalApprovedAt = new Date();
      if (job.status !== "FINAL") {
        const expiresAt = new Date();
        if (job.subscriptionType === "SIX_MONTHS") {
          expiresAt.setMonth(expiresAt.getMonth() + 6);
        } else if (job.subscriptionType === "TWELVE_MONTHS") {
          expiresAt.setMonth(expiresAt.getMonth() + 12);
        }
        updateData.expiresAt = expiresAt;

        // Set boost duration if boosted
        if (job.isBoosted) {
          const boostDays =
            job.boostPeriod === "SEVEN_DAYS" || String(job.boostPeriod) === "7"
              ? 7
              : job.boostPeriod === "THREE_DAYS" || String(job.boostPeriod) === "3"
              ? 3
              : 1;
          updateData.boostExpiresAt = new Date(Date.now() + boostDays * 24 * 60 * 60 * 1000);
        }
      }
    } else if (status === "EXPIRED" || status === "REJECTED" || status === "DISABLED") {
      updateData.isBoosted = false;
      updateData.boostExpiresAt = null;
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData
    });

    // Fetch system settings to check if SMS notifications are enabled
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const isSmsEnabled = settingsMap.smsNotify === "true" && settingsMap.userNotifyApproval === "true";

    // Handle side effects (SMS, Messages)
    if (status === "APPROVED") {
      // Calculate dynamic payment amount based on admin settings and job options
      const price6Month = parseFloat(settingsMap.price6Month || "25");
      const price12Month = parseFloat(settingsMap.price12Month || "45");
      const priceVip = parseFloat(settingsMap.priceVip || "15");
      const priceBoost1 = parseFloat(settingsMap.priceBoost1 || "5");
      const priceBoost3 = parseFloat(settingsMap.priceBoost3 || "12");
      const priceBoost7 = parseFloat(settingsMap.priceBoost7 || "20");

      let amount = job.subscriptionType === "TWELVE_MONTHS" ? price12Month : price6Month;
      if (job.isVip) amount += priceVip;
      if (job.isBoosted) {
        const periodStr = String(job.boostPeriod || "");
        if (periodStr === "SEVEN_DAYS" || periodStr === "7") {
          amount += priceBoost7;
        } else if (periodStr === "THREE_DAYS" || periodStr === "3") {
          amount += priceBoost3;
        } else {
          amount += priceBoost1;
        }
      }

      const subscriptionLabel = job.subscriptionType === "TWELVE_MONTHS" ? "۱۲ ماهه" : "۶ ماهه";
      const messageBody = `کاربر گرامی، شغل شما با عنوان "${job.title}" تایید اولیه شد. جهت تایید نهایی و فعال‌سازی در سایت، لطفاً با مراجعه به پنل کاربری نسبت به پرداخت مبلغ اشتراک (${subscriptionLabel}: $${amount}) اقدام فرمایید.`;

      if (isSmsEnabled && job.user?.mobile) {
        await sendMessage(job.user.mobile, messageBody);
      }

      // Also send system message
      await prisma.message.create({
        data: {
          userId: job.userId,
          title: "تایید اولیه و درخواست پرداخت",
          content: messageBody,
        }
      });
    } else if (status === "PENDING") {
      const messageBody = `کاربر گرامی، وضعیت شغل شما با عنوان "${job.title}" به «در حال بررسی» بازگردانده شد.`;

      if (isSmsEnabled && job.user?.mobile) {
        await sendMessage(job.user.mobile, messageBody);
      }

      await prisma.message.create({
        data: {
          userId: job.userId,
          title: "تغییر وضعیت شغل به در حال بررسی",
          content: messageBody,
        }
      });
    } else if (status === "NEEDS_EDIT") {
      const cleanNote = adminNote ? adminNote.replace("[NEEDS_EDIT] ", "") : "عدم رعایت قوانین";
      const messageBody = `کاربر گرامی، اطلاعات شغل شما با عنوان "${job.title}" نیاز به اصلاح دارد. دلیل ادمین: ${cleanNote}\nلطفا جهت اصلاح به پنل کاربری مراجعه کنید.`;

      if (isSmsEnabled && job.user?.mobile) {
        await sendMessage(job.user.mobile, messageBody);
      }

      await prisma.message.create({
        data: {
          userId: job.userId,
          title: "نیاز به اصلاح شغل",
          content: messageBody,
        }
      });
    } else if (status === "REJECTED") {
      const isNeedsEdit = adminNote?.startsWith("[NEEDS_EDIT]");
      const cleanNote = adminNote ? adminNote.replace("[NEEDS_EDIT] ", "") : "عدم تایید توسط ناظر";
      const messageBody = isNeedsEdit
        ? `کاربر گرامی، اطلاعات شغل شما با عنوان "${job.title}" نیاز به اصلاح دارد. دلیل ادمین: ${cleanNote}\nلطفا جهت اصلاح به پنل کاربری مراجعه کنید.`
        : `کاربر گرامی، متاسفانه شغل شما با عنوان "${job.title}" رد شد. دلیل: ${cleanNote}`;

      if (isSmsEnabled && job.user?.mobile) {
        await sendMessage(job.user.mobile, messageBody);
      }

      await prisma.message.create({
        data: {
          userId: job.userId,
          title: isNeedsEdit ? "نیاز به اصلاح شغل" : "رد شغل",
          content: messageBody,
        }
      });
    } else if (status === "FINAL") {
      const messageBody = `کاربر گرامی، شغل شما با عنوان "${job.title}" با موفقیت تایید نهایی و در سایت منتشر شد.`;

      if (isSmsEnabled && job.user?.mobile) {
        await sendMessage(job.user.mobile, messageBody);
      }

      await prisma.message.create({
        data: {
          userId: job.userId,
          title: "تایید نهایی شغل",
          content: messageBody,
        }
      });
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error("Admin Update Job Status Error:", error);
    return NextResponse.json(
      { error: "خطایی رخ داد." },
      { status: 500 }
    );
  }
}
