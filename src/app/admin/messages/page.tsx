import prisma from "@/lib/prisma";
import MessagesClient from "./MessagesClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/messages");
  }

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
