import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrder } from "@/lib/paypal";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { type, id } = data; // type: "ad" | "job", id: number

    if (!type || !id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const itemId = parseInt(id);

    // Fetch settings to get dynamic prices
    const settings = await prisma.systemSetting.findMany();
    const getSetting = (key: string) => settings.find(s => s.key === key)?.value;
    const adPrice = parseInt(getSetting("adPrice") || "50", 10);
    const jobPrice = parseInt(getSetting("jobPrice") || "50", 10);

    let amount = 0;
    let description = "";

    if (type === "ad") {
      const ad = await prisma.ad.findUnique({ where: { id: itemId } });
      if (!ad || ad.userId !== userId) {
        return NextResponse.json({ error: "Ad not found or unauthorized" }, { status: 404 });
      }
      if (ad.status !== "APPROVED") {
        return NextResponse.json({ error: "Ad must be APPROVED before payment" }, { status: 400 });
      }
      amount = adPrice;
      description = `Payment for Commercial Ad: ${ad.title}`;
    } else if (type === "job") {
      const job = await prisma.job.findUnique({ where: { id: itemId } });
      if (!job || job.userId !== userId) {
        return NextResponse.json({ error: "Job not found or unauthorized" }, { status: 404 });
      }
      if (job.status !== "APPROVED") {
        return NextResponse.json({ error: "Job must be APPROVED before payment" }, { status: 400 });
      }
      amount = jobPrice;
      description = `Payment for Job Listing: ${job.title}`;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (amount <= 0) {
      // If price is 0, just mark it as paid directly
      return NextResponse.json({ error: "Price is 0, no payment required" }, { status: 400 });
    }

    const host = request.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const returnUrl = `${baseUrl}/payment/success?type=${type}&id=${itemId}`;
    const cancelUrl = `${baseUrl}/payment/cancel?type=${type}&id=${itemId}`;

    const order = await createOrder(amount, description, returnUrl, cancelUrl);

    // Order contains links array. We need to find the one with rel === "approve"
    const approveLink = order.links.find((link: any) => link.rel === "approve")?.href;

    if (!approveLink) {
      throw new Error("No approve link found in PayPal response");
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      approveUrl: approveLink
    });

  } catch (error: any) {
    console.error("Payment Create Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
