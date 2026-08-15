import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { capturePayment } from "@/lib/paypal";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { token, type, id, period } = data; // token is PayPal order ID

    if (!token || !type || !id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const itemId = parseInt(id);

    // 1. Capture the payment on PayPal
    const captureData = await capturePayment(token);

    // 2. Verify capture success
    if (captureData.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Payment was not completed successfully." },
        { status: 400 }
      );
    }

    const amountStr = captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value || "0";
    const amount = parseFloat(amountStr);
    const transactionId = captureData.purchase_units[0]?.payments?.captures[0]?.id;

    // 3. Update DB based on type
    if (type === "ad") {
      await prisma.ad.update({
        where: { id: itemId },
        data: { status: "FINAL" }
      });
      // Log payment
      await prisma.payment.create({
        data: {
          userId,
          adId: itemId,
          amount,
          status: "COMPLETED",
          method: "PAYPAL",
          reference: transactionId,
          description: "پرداخت آگهی تجاری"
        }
      });
    } else if (type === "job") {
      const existingJob = await prisma.job.findUnique({ where: { id: itemId } });
      const monthsToAdd = existingJob?.subscriptionType === "TWELVE_MONTHS" ? 12 : 6;
      const now = new Date();
      const expiresAt = new Date(now.setMonth(now.getMonth() + monthsToAdd));

      let boostExpiresAt: Date | undefined;
      if (existingJob?.isBoosted) {
        const bDays =
          existingJob.boostPeriod === "SEVEN_DAYS" || String(existingJob.boostPeriod) === "7"
            ? 7
            : existingJob.boostPeriod === "THREE_DAYS" || String(existingJob.boostPeriod) === "3"
            ? 3
            : 1;
        boostExpiresAt = new Date(Date.now() + bDays * 24 * 60 * 60 * 1000);
      }

      await prisma.job.update({
        where: { id: itemId },
        data: {
          status: "FINAL",
          paidAt: new Date(),
          finalApprovedAt: new Date(),
          expiresAt: expiresAt,
          ...(boostExpiresAt ? { boostExpiresAt } : {}),
        }
      });
      // Log payment
      await prisma.payment.create({
        data: {
          userId,
          jobId: itemId,
          amount,
          status: "COMPLETED",
          method: "PAYPAL",
          reference: transactionId,
          description: `پرداخت اشتراک شغل (${monthsToAdd} ماهه)`
        }
      });
    } else if (type === "job_boost") {
      const boostDays = String(period || "1");
      const boostEnum =
        boostDays === "7" || boostDays === "SEVEN_DAYS"
          ? "SEVEN_DAYS"
          : boostDays === "3" || boostDays === "THREE_DAYS"
          ? "THREE_DAYS"
          : "ONE_DAY";

      const numDays = boostEnum === "SEVEN_DAYS" ? 7 : boostEnum === "THREE_DAYS" ? 3 : 1;
      const boostExpiresAt = new Date(Date.now() + numDays * 24 * 60 * 60 * 1000);

      await prisma.job.update({
        where: { id: itemId },
        data: {
          isBoosted: true,
          boostPeriod: boostEnum,
          boostExpiresAt,
          updatedAt: new Date(),
        }
      });

      await prisma.payment.create({
        data: {
          userId,
          jobId: itemId,
          amount,
          status: "COMPLETED",
          method: "PAYPAL",
          reference: transactionId,
          description: `ارتقا به پله (Boost) شغل - ${boostDays} روزه`
        }
      });
    } else if (type === "job_vip") {
      await prisma.job.update({
        where: { id: itemId },
        data: {
          isVip: true,
          updatedAt: new Date(),
        }
      });

      await prisma.payment.create({
        data: {
          userId,
          jobId: itemId,
          amount,
          status: "COMPLETED",
          method: "PAYPAL",
          reference: transactionId,
          description: "ارتقا به اشتراک ویژه (VIP) شغل"
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Payment Capture Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to capture payment" },
      { status: 500 }
    );
  }
}
