import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Fetch Tickets Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت تیکت‌ها رخ داد." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "لطفاً ابتدا وارد شوید." }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);
    const { subject, message } = await request.json();

    if (!subject || !subject.trim() || !message || !message.trim()) {
      return NextResponse.json(
        { error: "موضوع و متن پیام الزامی است." },
        { status: 400 }
      );
    }

    // Create Ticket and initial TicketMessage inside a transaction
    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          userId,
          subject: subject.trim(),
          status: "OPEN",
        }
      });

      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          content: message.trim(),
          isAdmin: false,
        }
      });

      return tx.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    });

    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    return NextResponse.json(
      { error: "خطایی در ثبت تیکت رخ داد." },
      { status: 500 }
    );
  }
}
