import prisma from "@/lib/prisma";
import PaymentsClient from "./PaymentsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      user: true,
      job: true,
      ad: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedPayments = payments.map(p => ({
    id: p.id,
    amount: p.amount,
    user: p.user.username || p.user.mobile,
    item: p.job ? `شغل: ${p.job.title}` : p.ad ? `آگهی: ${p.ad.title}` : "سایر",
    type: p.job ? "SUBSCRIPTION" : p.ad ? "AD_FEE" : "OTHER", // Mock type mapping
    status: p.status,
    refId: p.reference || "—",
    createdAt: p.createdAt.toISOString()
  }));

  return <PaymentsClient initialPayments={formattedPayments} />;
}
