import prisma from "@/lib/prisma";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMessagesPage() {
  const tickets = await prisma.ticket.findMany({
    include: {
      user: true,
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const formattedTickets = tickets.map(t => ({
    id: t.id,
    user: t.user.username || t.user.mobile,
    mobile: t.user.mobile,
    subject: t.subject,
    status: t.status,
    messages: t.messages.map(m => ({
      id: m.id,
      content: m.content,
      isAdmin: m.isAdmin,
      createdAt: m.createdAt.toISOString()
    })),
    lastMessage: t.messages[t.messages.length - 1]?.content || "بدون پیام",
    updatedAt: t.updatedAt.toISOString(),
    createdAt: t.createdAt.toISOString()
  }));

  return <MessagesClient initialTickets={formattedTickets} />;
}
