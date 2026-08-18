import prisma from "@/lib/prisma";
import UsersClient from "./UsersClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/users");
  }

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { jobs: true, ads: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedUsers = users.map(u => ({
    id: u.id,
    mobile: u.mobile,
    username: u.username,
    role: u.role,
    jobCount: u._count.jobs,
    adCount: u._count.ads,
    isActive: u.isActive,
    // Just passing standard date string, formatting can be done in client or here
    createdAt: u.createdAt.toISOString() 
  }));

  return <UsersClient initialUsers={formattedUsers} />;
}
