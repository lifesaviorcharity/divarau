import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true }
    });

    const [jobs, ads, tickets] = await Promise.all([
      prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { city: true }
      }),
      prisma.ad.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ticket.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    // For demo purposes, returning empty messages array.
    // In a real app, you might have a dedicated Message model.
    const messages: any[] = []; 

    return NextResponse.json({
      user: session.user,
      username: user?.username || "",
      email: user?.email || "",
      jobs,
      ads,
      tickets,
      messages
    });
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت اطلاعات پروفایل رخ داد." },
      { status: 500 }
    );
  }
}
