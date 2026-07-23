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
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData
    });

    // Handle side effects (SMS, Messages)
    if (status === "APPROVED") {
      // Calculate mock payment amount
      let amount = job.subscriptionType === "SIX_MONTHS" ? 100 : 200;
      if (job.isVip) amount += 50;
      if (job.isBoosted) amount += 20;

      const messageBody = `کاربر گرامی، شغل شما با عنوان "${job.title}" تایید اولیه شد. جهت تایید نهایی لطفا مبلغ ${amount}$ را پرداخت نموده و رسید آن را به همراه شماره ${job.id} به واتساپ/تلگرام پشتیبانی ارسال نمایید. مهلت پرداخت: 48 ساعت.`;
      
      await sendMessage(job.user.mobile, messageBody);
      
      // Also send system message
      await prisma.message.create({
        data: {
          userId: job.userId,
          title: "تایید اولیه و درخواست پرداخت",
          content: messageBody,
        }
      });
    } else if (status === "NEEDS_EDIT") {
      const messageBody = `کاربر گرامی، اطلاعات شغل شما با عنوان "${job.title}" نیاز به اصلاح دارد. دلیل ادمین: ${adminNote || "عدم رعایت قوانین"}\nلطفا جهت اصلاح به پنل کاربری مراجعه کنید.`;
      
      await sendMessage(job.user.mobile, messageBody);
      
      await prisma.message.create({
        data: {
          userId: job.userId,
          title: "نیاز به اصلاح شغل",
          content: messageBody,
        }
      });
    } else if (status === "REJECTED") {
      const messageBody = `کاربر گرامی، متاسفانه شغل شما با عنوان "${job.title}" رد شد. دلیل: ${adminNote || "عدم تایید توسط ناظر"}`;
      await sendMessage(job.user.mobile, messageBody);
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
