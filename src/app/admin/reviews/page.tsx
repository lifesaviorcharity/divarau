import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ReviewsClient from "./ReviewsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const reviews = await prisma.review.findMany({
    include: {
      user: {
        select: {
          mobile: true,
          username: true
        }
      },
      job: {
        select: {
          title: true,
          category: { select: { name: true, id: true } },
          subCategory: { select: { name: true, id: true } }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const formattedReviews = reviews.map(r => ({
    id: r.id,
    jobId: r.jobId,
    jobTitle: r.job?.title || "نامشخص",
    category: r.job?.category?.name || "نامشخص",
    categoryId: r.job?.category?.id,
    subCategory: r.job?.subCategory?.name || "نامشخص",
    subCategoryId: r.job?.subCategory?.id,
    userMobile: r.user?.mobile || "نامشخص",
    userName: r.user?.username || "کاربر",
    rating: r.rating,
    comment: r.comment || "",
    isApproved: r.isApproved,
    createdAt: r.createdAt.toISOString()
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ReviewsClient initialReviews={formattedReviews} />
    </div>
  );
}
