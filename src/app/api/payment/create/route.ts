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
    const { type, id, period } = data; // type: "ad" | "job" | "job_boost" | "job_vip", id: number, period?: string

    if (!type || !id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const itemId = parseInt(id);

    // Fetch settings to get dynamic prices
    const settings = await prisma.systemSetting.findMany();
    const getSetting = (key: string) => settings.find((s) => s.key === key)?.value;

    const price6Month = parseInt(getSetting("price6Month") || getSetting("jobPrice") || "50", 10);
    const price12Month = parseInt(getSetting("price12Month") || "90", 10);
    const priceVip = parseInt(getSetting("priceVip") || "30", 10);
    const priceBoost1 = parseInt(getSetting("priceBoost1") || "10", 10);
    const priceBoost3 = parseInt(getSetting("priceBoost3") || "25", 10);
    const priceBoost7 = parseInt(getSetting("priceBoost7") || "50", 10);
    const priceCommercialAd = parseInt(getSetting("priceCommercialAd") || getSetting("adPrice") || "50", 10);

    let amount = 0;
    let description = "";
    let returnUrlParams = `type=${type}&id=${itemId}`;

    if (type === "ad") {
      const ad = await prisma.ad.findUnique({ where: { id: itemId } });
      if (!ad || ad.userId !== userId) {
        return NextResponse.json({ error: "Ad not found or unauthorized" }, { status: 404 });
      }
      if (ad.status !== "APPROVED") {
        return NextResponse.json({ error: "آگهی باید در وضعیت تأیید اولیه باشد." }, { status: 400 });
      }
      amount = priceCommercialAd;
      description = `Payment for Commercial Ad: ${ad.title}`;
    } else if (type === "job") {
      const job = await prisma.job.findUnique({ where: { id: itemId } });
      if (!job || job.userId !== userId) {
        return NextResponse.json({ error: "Job not found or unauthorized" }, { status: 404 });
      }
      if (job.status !== "APPROVED" && job.status !== "EXPIRED") {
        return NextResponse.json({ error: "شغل باید در وضعیت تأیید اولیه یا منقضی باشد." }, { status: 400 });
      }
      amount = job.subscriptionType === "TWELVE_MONTHS" ? price12Month : price6Month;
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
      description = `Payment for Job Listing (${job.subscriptionType === "TWELVE_MONTHS" ? "12 Months" : "6 Months"}): ${job.title}`;
    } else if (type === "job_boost") {
      const job = await prisma.job.findUnique({ where: { id: itemId } });
      if (!job || job.userId !== userId) {
        return NextResponse.json({ error: "Job not found or unauthorized" }, { status: 404 });
      }
      if (job.status !== "FINAL") {
        return NextResponse.json({ error: "فقط مشاغل با تأیید نهایی قابلیت پله شدن دارند." }, { status: 400 });
      }

      const boostDays = String(period || "1");
      if (boostDays === "7" || boostDays === "SEVEN_DAYS") {
        amount = priceBoost7;
      } else if (boostDays === "3" || boostDays === "THREE_DAYS") {
        amount = priceBoost3;
      } else {
        amount = priceBoost1;
      }

      returnUrlParams += `&period=${boostDays}`;
      description = `Boost (${boostDays} Days) for Job: ${job.title}`;
    } else if (type === "job_vip") {
      const job = await prisma.job.findUnique({ where: { id: itemId } });
      if (!job || job.userId !== userId) {
        return NextResponse.json({ error: "Job not found or unauthorized" }, { status: 404 });
      }
      if (job.status !== "FINAL") {
        return NextResponse.json({ error: "فقط مشاغل با تأیید نهایی قابلیت ارتقا به ویژه دارند." }, { status: 400 });
      }
      amount = priceVip;
      description = `VIP Upgrade for Job: ${job.title}`;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "مبلغ نامعتبر است." }, { status: 400 });
    }

    const host = request.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const returnUrl = `${baseUrl}/payment/success?${returnUrlParams}`;
    const cancelUrl = `${baseUrl}/payment/cancel?${returnUrlParams}`;

    const order = await createOrder(amount, description, returnUrl, cancelUrl);

    const approveLink = order.links.find((link: any) => link.rel === "approve")?.href;

    if (!approveLink) {
      throw new Error("No approve link found in PayPal response");
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      approveUrl: approveLink,
    });
  } catch (error: any) {
    console.error("Payment Create Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
