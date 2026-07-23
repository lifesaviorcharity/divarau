"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Trash2, Eye, ChevronDown } from "lucide-react";
import { toJalali } from "@/lib/utils";

type Review = {
  id: number;
  jobId: number;
  jobTitle: string;
  category: string;
  categoryId: number;
  subCategory: string;
  subCategoryId: number;
  userMobile: string;
  userName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
};

export default function ReviewsClient({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Bulk Delete State
  const [bulkFilterType, setBulkFilterType] = useState<"category" | "subCategory" | "job">("category");
  const [bulkFilterValue, setBulkFilterValue] = useState<string>("");

  const pendingReviews = reviews.filter((r) => !r.isApproved);
  const approvedReviews = reviews.filter((r) => r.isApproved);

  const displayedReviews = activeTab === "pending" ? pendingReviews : approvedReviews;

  // Extract unique options for bulk delete
  const categories = Array.from(new Set(approvedReviews.map(r => JSON.stringify({ id: r.categoryId, name: r.category })))).map(s => JSON.parse(s));
  const subCategories = Array.from(new Set(approvedReviews.map(r => JSON.stringify({ id: r.subCategoryId, name: r.subCategory })))).map(s => JSON.parse(s));
  const jobs = Array.from(new Set(approvedReviews.map(r => JSON.stringify({ id: r.jobId, name: r.jobTitle })))).map(s => JSON.parse(s));

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true })
      });
      if (res.ok) {
        setReviews(reviews.map(r => r.id === id ? { ...r, isApproved: true } : r));
        setSelectedReview(null);
        // Removed success alert
      } else {
        alert("خطا در تایید دیدگاه");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این دیدگاه اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id));
        setSelectedReview(null);
        // Removed success alert
      } else {
        alert("خطا در حذف دیدگاه");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkFilterValue) {
      alert("لطفا یک مورد را انتخاب کنید.");
      return;
    }

    if (!confirm("آیا از حذف گروهی دیدگاه‌های تایید شده برای این بخش اطمینان دارید؟")) return;

    try {
      const res = await fetch(`/api/admin/reviews/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: bulkFilterType, id: parseInt(bulkFilterValue) })
      });
      if (res.ok) {
        // Removed success alert
        // Optimistically remove from state
        setReviews(reviews.filter(r => {
          if (!r.isApproved) return true;
          if (bulkFilterType === "category" && r.categoryId === parseInt(bulkFilterValue)) return false;
          if (bulkFilterType === "subCategory" && r.subCategoryId === parseInt(bulkFilterValue)) return false;
          if (bulkFilterType === "job" && r.jobId === parseInt(bulkFilterValue)) return false;
          return true;
        }));
        setBulkFilterValue("");
      } else {
        alert("خطا در حذف گروهی");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">مدیریت دیدگاه‌ها</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "pending" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          نظرات تایید نشده ({pendingReviews.length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "approved" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          نظرات تایید شده ({approvedReviews.length})
        </button>
      </div>

      {/* Bulk Delete Section for Approved Tab */}
      {activeTab === "approved" && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-end md:items-center">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-red-800 mb-1">حذف گروهی نظرات تایید شده بر اساس:</label>
            <div className="flex gap-2">
              <select 
                value={bulkFilterType} 
                onChange={(e) => { setBulkFilterType(e.target.value as any); setBulkFilterValue(""); }}
                className="px-3 py-2 text-sm bg-white border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="category">گروه شغلی</option>
                <option value="subCategory">دسته شغلی</option>
                <option value="job">عنوان شغلی</option>
              </select>

              <select
                value={bulkFilterValue}
                onChange={(e) => setBulkFilterValue(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-white border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">-- انتخاب کنید --</option>
                {bulkFilterType === "category" && categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                {bulkFilterType === "subCategory" && subCategories.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                {bulkFilterType === "job" && jobs.map((j: any) => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleBulkDelete}
            className="px-6 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors"
          >
            حذف گروهی
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div style={{ overflowX: 'scroll', WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">موبایل کاربر</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">شغل</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">گروه / دسته</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">امتیاز</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">تاریخ</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {displayedReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">موردی یافت نشد.</td>
                </tr>
              ) : (
                displayedReviews.map((review) => (
                  <tr key={review.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedReview(review)}>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">{review.userMobile}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{review.jobTitle}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{review.category} / {review.subCategory}</td>
                    <td className="px-4 py-3 text-amber-500 font-bold">{review.rating} ستاره</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{toJalali(new Date(review.createdAt))}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedReview(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-800">جزئیات دیدگاه</h3>
              <button onClick={() => setSelectedReview(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">شغل:</span>
                <span className="font-semibold text-gray-800">{selectedReview.jobTitle}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">گروه شغلی:</span>
                <span className="text-gray-800">{selectedReview.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">موبایل کاربر:</span>
                <span className="text-gray-800" dir="ltr">{selectedReview.userMobile}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">امتیاز:</span>
                <span className="text-amber-500 font-bold">{selectedReview.rating} ستاره</span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">متن دیدگاه:</span>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl min-h-[80px]">
                  {selectedReview.comment || "بدون متن"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!selectedReview.isApproved && (
                <button onClick={() => handleApprove(selectedReview.id)}
                  className="flex-1 py-2 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 transition-colors flex justify-center items-center gap-1">
                  <CheckCircle size={16} /> تایید
                </button>
              )}
              <button onClick={() => handleDelete(selectedReview.id)}
                className="flex-1 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors flex justify-center items-center gap-1">
                <Trash2 size={16} /> حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
