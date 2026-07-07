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
    const { token, type, id } = data; // token is PayPal order ID

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
          reference: transactionId
        }
      });
    } else if (type === "job") {
      await prisma.job.update({
        where: { id: itemId },
        data: { status: "FINAL" }
      });
      // Log payment
      await prisma.payment.create({
        data: {
          userId,
          jobId: itemId,
          amount,
          status: "COMPLETED",
          method: "PAYPAL",
          reference: transactionId
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
