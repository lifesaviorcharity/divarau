import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    // Separate IDs
    const jobIds = items.filter(i => i.type === 'job').map(i => i.id);
    const adIds = items.filter(i => i.type === 'ad').map(i => i.id);

    // Fetch details to get user emails
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      include: { user: true }
    });

    const ads = await prisma.ad.findMany({
      where: { id: { in: adIds } },
      include: { user: true }
    });

    // In a real production environment, you would use nodemailer, SendGrid, or Resend here.
    // We mock the sending process by logging to console.
    
    console.log("=== START SENDING EXPIRATION REMINDER EMAILS ===");
    for (const job of jobs) {
      if (job.user.email) {
        console.log(`Sending reminder to ${job.user.email} for Job: ${job.title} (Expires: ${job.expiresAt})`);
      }
    }

    for (const ad of ads) {
      if (ad.user.email) {
        console.log(`Sending reminder to ${ad.user.email} for Ad: ${ad.title} (Expires: ${ad.expiresAt})`);
      }
    }
    console.log("=== FINISHED SENDING EMAILS ===");

    return NextResponse.json({ success: true, message: "Emails sent successfully" });
  } catch (error) {
    console.error("Reminder Email API Error:", error);
    return NextResponse.json({ error: "خطایی در ارسال ایمیل‌ها رخ داد." }, { status: 500 });
  }
}
