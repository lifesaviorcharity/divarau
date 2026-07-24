import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const ticketId = parseInt(id, 10);
    const { replyText, status } = await request.json();

    if (!ticketId) {
      return NextResponse.json({ error: "شناسه تیکت نامعتبر است." }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
    }

    if (replyText && replyText.trim()) {
      await prisma.ticketMessage.create({
        data: {
          ticketId,
          content: replyText.trim(),
          isAdmin: true
        }
      });

      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: status || "IN_PROGRESS"
        }
      });
    } else if (status) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status }
      });
    }

    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error("Admin Ticket Reply Error:", error);
    return NextResponse.json(
      { error: "خطایی در ثبت پاسخ رخ داد." },
      { status: 500 }
    );
  }
}
