import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMessage } from "@/lib/twilio";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = await request.json(); // { type: 'job' | 'ad', id: number }[]

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "لیست نامعتبر است" }, { status: 400 });
    }

    // Fetch system settings to check if SMS notifications are enabled
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const isSmsEnabled = settingsMap.smsNotify === "true";
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Separate IDs
    const jobIds = items.filter((i) => i.type === "job").map((i) => i.id);
    const adIds = items.filter((i) => i.type === "ad").map((i) => i.id);

    // Fetch details
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      include: { user: true },
    });

    const ads = await prisma.ad.findMany({
      where: { id: { in: adIds } },
      include: { user: true },
    });

    let sentCount = 0;

    // Send reminders for Jobs
    for (const job of jobs) {
      const msgTitle = "⚠️ یادآوری تمدید اشتراک شغل";
      const msgContent = `کاربر گرامی، اشتراک شغل شما با عنوان "${job.title}" در آستانه انقضا یا منقضی شده است. جهت تمدید اشتراک و فعال ماندن آگهی در سایت، به پنل کاربری خود مراجعه کنید.`;

      // 1. In-App Notification Message
      await prisma.message.create({
        data: {
          userId: job.userId,
          title: msgTitle,
          content: msgContent,
        },
      });

      // 2. SMS Notification (if enabled & mobile available)
      if (isSmsEnabled && job.user?.mobile) {
        await sendMessage(job.user.mobile, msgContent);
      }

      // 3. Email Notification (Nodemailer Live / SMTP)
      if (job.user?.email) {
        const html = `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 24px; background-color: #f9fafb; color: #1f2937; border-radius: 12px;">
            <div style="max-width: 600px; margin: 0 auto; bg-white: #ffffff; padding: 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
              <h2 style="color: #2563eb; margin-top: 0; font-size: 20px;">⚠️ یادآوری تمدید اشتراک شغل</h2>
              <p style="font-size: 14px; line-height: 1.6;">کاربر گرامی،</p>
              <p style="font-size: 14px; line-height: 1.6;">اشتراک شغل شما با عنوان <strong style="color: #111827;">«${job.title}»</strong> در سامانه مشاغل ایرانیان استرالیا در آستانه انقضا قرار گرفته یا منقضی شده است.</p>
              <p style="font-size: 14px; line-height: 1.6;">جهت فعال ماندن آگهی، نمایش راه‌های ارتباطی و عدم قطعی در ارائه خدمات، لطفاً نسبت به تمدید اشتراک اقدام فرمایید.</p>
              <div style="margin-top: 24px; text-align: center;">
                <a href="${appUrl}/profile" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px;">تمدید اشتراک در پنل کاربری</a>
              </div>
              <hr style="margin-top: 32px; border: none; border-top: 1px solid #f3f4f6;" />
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">نیازمندی‌ها و مشاغل ایرانیان استرالیا (AUIR)</p>
            </div>
          </div>
        `;
        await sendEmail({
          to: job.user.email,
          subject: `⚠️ یادآوری تمدید اشتراک: ${job.title}`,
          text: msgContent,
          html,
        });
      }

      sentCount++;
    }

    // Send reminders for Ads
    for (const ad of ads) {
      const msgTitle = "⚠️ یادآوری تمدید آگهی";
      const msgContent = `کاربر گرامی، آگهی شما با عنوان "${ad.title}" در آستانه انقضا یا منقضی شده است. جهت تمدید آگهی به پنل کاربری مراجعه کنید.`;

      // 1. In-App Notification Message
      await prisma.message.create({
        data: {
          userId: ad.userId,
          title: msgTitle,
          content: msgContent,
        },
      });

      // 2. SMS Notification (if enabled & mobile available)
      if (isSmsEnabled && ad.user?.mobile) {
        await sendMessage(ad.user.mobile, msgContent);
      }

      // 3. Email Notification (Nodemailer Live / SMTP)
      if (ad.user?.email) {
        const html = `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 24px; background-color: #f9fafb; color: #1f2937; border-radius: 12px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e5e7eb;">
              <h2 style="color: #2563eb; margin-top: 0; font-size: 20px;">⚠️ یادآوری تمدید آگهی</h2>
              <p style="font-size: 14px; line-height: 1.6;">کاربر گرامی،</p>
              <p style="font-size: 14px; line-height: 1.6;">آگهی شما با عنوان <strong style="color: #111827;">«${ad.title}»</strong> در آستانه انقضا قرار گرفته یا منقضی شده است.</p>
              <div style="margin-top: 24px; text-align: center;">
                <a href="${appUrl}/profile" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px;">تمدید آگهی در پنل کاربری</a>
              </div>
              <hr style="margin-top: 32px; border: none; border-top: 1px solid #f3f4f6;" />
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">نیازمندی‌ها و مشاغل ایرانیان استرالیا (AUIR)</p>
            </div>
          </div>
        `;
        await sendEmail({
          to: ad.user.email,
          subject: `⚠️ یادآوری تمدید آگهی: ${ad.title}`,
          text: msgContent,
          html,
        });
      }

      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `یادآوری برای ${sentCount} مورد با موفقیت ارسال شد.`,
    });
  } catch (error) {
    console.error("Reminder API Error:", error);
    return NextResponse.json({ error: "خطایی در ارسال یادآوری‌ها رخ داد." }, { status: 500 });
  }
}
