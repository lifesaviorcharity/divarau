import prisma from "@/lib/prisma";
import MessagesClient from "./MessagesClient";

export default async function AdminMessagesPage() {
  const tickets = await prisma.ticket.findMany({
    include: {
      user: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const formattedTickets = tickets.map(t => ({
    id: t.id,
    user: t.user.username || t.user.mobile,
    subject: t.subject,
    status: t.status,
    priority: "MEDIUM", // Prisma model does not have priority, using default mock
    lastMessage: t.messages[0]?.content || "بدون پیام",
    updatedAt: t.updatedAt.toISOString(),
    createdAt: t.createdAt.toISOString()
  }));

  return <MessagesClient initialTickets={formattedTickets} />;
}
