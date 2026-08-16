"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ChevronDown,
  PowerOff,
  Power,
  CheckCheck,
  RotateCcw,
  Image as ImageIcon,
  Star,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  MapPin,
  Globe,
  Mail,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toJalali } from "@/lib/utils";

export default function JobsClient({ initialJobs }: { initialJobs: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [viewJob, setViewJob] = useState<any | null>(null);
  const [viewModalImageIndex, setViewModalImageIndex] = useState(0);
  const [viewJobImages, setViewJobImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const openViewModal = async (job: any) => {
    setViewJob(job);
    setViewModalImageIndex(0);
    setViewJobImages([]);
    if (job.imageCount > 0) {
      setLoadingImages(true);
      try {
        const res = await fetch(`/api/admin/jobs/${job.id}/images`);
        if (res.ok) {
          const data = await res.json();
          setViewJobImages(data.images || []);
        }
      } catch (e) {
        console.error("Failed to load images", e);
      } finally {
        setLoadingImages(false);
      }
    }
  };
  const [adminNote, setAdminNote] = useState("");

  const [jobs, setJobs] = useState(initialJobs);

  const cleanQuery = searchTerm.trim().toLowerCase();

  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      !cleanQuery ||
      (job.title && job.title.toLowerCase().includes(cleanQuery)) ||
      (job.user && job.user.toLowerCase().includes(cleanQuery)) ||
      (job.phone && job.phone.toLowerCase().includes(cleanQuery)) ||
      (job.city && job.city.toLowerCase().includes(cleanQuery)) ||
      (job.category && job.category.toLowerCase().includes(cleanQuery)) ||
      (job.subCategory && job.subCategory.toLowerCase().includes(cleanQuery)) ||
      (job.description && job.description.toLowerCase().includes(cleanQuery));
    const matchStatus = statusFilter === "ALL" || job.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAction = async (jobId: number, action: string) => {
    let newStatus = "";
    let alertMsg = "";
    const targetJob = jobs.find((j) => j.id === jobId);

    switch (action) {
      case "approve":
        newStatus = "APPROVED";
        alertMsg = `شغل ${jobId} تأیید اولیه شد و پیامک پرداخت ارسال شد.`;
        break;
      case "revert_to_pending":
        newStatus = "PENDING";
        alertMsg = `شغل ${jobId} به وضعیت در حال بررسی بازگردانده شد.`;
        break;
      case "reject":
        if (!adminNote) {
          alert("لطفاً دلیل رد را وارد کنید");
          return;
        }
        newStatus = "REJECTED";
        alertMsg = `شغل ${jobId} رد شد.`;
        break;
      case "needs_edit":
        if (!adminNote) {
          alert("لطفاً نکات اصلاح را وارد کنید");
          return;
        }
        newStatus = "NEEDS_EDIT";
        alertMsg = `شغل ${jobId} جهت اصلاح به کاربر برگشت داده شد.`;
        break;
      case "final_approve":
        newStatus = "FINAL";
        alertMsg = `شغل ${jobId} تأیید نهایی شد.`;
        break;
      case "enable":
        let restoreStatus = "FINAL";
        if (targetJob?.adminNote && targetJob.adminNote.startsWith("[DISABLED]:")) {
          restoreStatus = targetJob.adminNote.replace("[DISABLED]:", "");
        }
        newStatus = restoreStatus;
        alertMsg = `شغل ${jobId} فعال گردید.`;
        break;
      case "disable":
        newStatus = "DISABLED";
        alertMsg = `شغل ${jobId} غیرفعال شد.`;
        break;
      default:
        return;
    }

    const noteToSend =
      action === "disable"
        ? `[DISABLED]:${targetJob?.status || "FINAL"}`
        : action === "enable"
          ? null
          : adminNote;

    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote: noteToSend }),
      });
      if (res.ok) {
        setJobs(
          jobs.map((j) =>
            j.id === jobId ? { ...j, status: newStatus, adminNote: noteToSend } : j
          )
        );
        alert(alertMsg);
      } else {
        alert("خطا در اعمال تغییرات.");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این شغل اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs(jobs.filter((j) => j.id !== id));
      } else {
        alert("خطا در حذف شغل");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const getStatusInfo = (statusStr: string) => {
    switch (statusStr) {
      case "FINAL":
        return { label: "تایید نهایی", color: "bg-green-100 text-green-700" };
      case "APPROVED":
        return { label: "تایید اولیه", color: "bg-blue-100 text-blue-700" };
      case "PAID":
        return { label: "پرداخت شده", color: "bg-purple-100 text-purple-700" };
      case "PENDING":
        return { label: "در حال بررسی", color: "bg-yellow-100 text-yellow-700" };
      case "REJECTED":
        return { label: "رد شده", color: "bg-red-100 text-red-700" };
      case "NEEDS_EDIT":
        return { label: "نیاز به اصلاح", color: "bg-orange-100 text-orange-700" };
      case "DISABLED":
        return { label: "غیرفعال", color: "bg-gray-100 text-gray-600" };
      default:
        return { label: statusStr, color: "bg-gray-100 text-gray-700" };
    }
  };

  const getSubscriptionLabel = (type: string) => {
    switch (type) {
      case "SIX_MONTHS":
        return "۶ ماهه (۱۸۰ روز)";
      case "TWELVE_MONTHS":
        return "۱۲ ماهه (۳۶۵ روز)";
      default:
        return type || "۶ ماهه";
    }
  };

  const getBoostPeriodLabel = (period: string) => {
    switch (period) {
      case "ONE_DAY":
      case "1_DAYS":
        return "۱ روزه";
      case "THREE_DAYS":
      case "3_DAYS":
        return "۳ روزه";
      case "SEVEN_DAYS":
      case "7_DAYS":
        return "۷ روزه";
      default:
        return period || "فعال";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">مدیریت مشاغل</h1>
        <span className="text-sm text-gray-500">{filteredJobs.length} شغل</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در مشاغل..."
            className="w-full pr-9 pl-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="ALL">همه وضعیت‌ها</option>
          <option value="PENDING">در حال بررسی</option>
          <option value="APPROVED">تأیید اولیه</option>
          <option value="PAID">پرداخت شده</option>
          <option value="FINAL">تأیید نهایی</option>
          <option value="REJECTED">رد شده</option>
          <option value="NEEDS_EDIT">نیاز به اصلاح</option>
          <option value="DISABLED">غیرفعال</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div style={{ overflowX: "scroll", WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">عنوان</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">کاربر</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">شهر</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">اشتراک و خدمات</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  تصاویر
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  وضعیت
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  تاریخ
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job, index) => {
                const isFirstMatch = cleanQuery.length > 0 && index === 0;
                return (
                  <tr
                    key={job.id}
                    className={`border-b transition-all duration-200 ${isFirstMatch
                      ? "bg-amber-100/90 hover:bg-amber-100 border-amber-300 ring-2 ring-amber-400/60 shadow-sm"
                      : "border-gray-50 hover:bg-gray-50/50"
                      }`}
                  >
                    <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      <span>{job.title}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{job.user}</td>
                    <td className="px-4 py-3 text-gray-600">{job.city}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                          {getSubscriptionLabel(job.subscriptionType)}
                        </span>
                        {job.isVip && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md flex items-center gap-0.5">
                            <Star size={10} className="fill-amber-600" /> ویژه
                          </span>
                        )}
                        {job.isBoosted && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded-md flex items-center gap-0.5">
                            <Zap size={10} className="fill-purple-600" /> پله ({getBoostPeriodLabel(job.boostPeriod)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <ImageIcon size={14} className="text-blue-500" />
                        {job.imageCount || 0} تصویر
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-[10px] font-semibold rounded-lg whitespace-nowrap inline-block ${getStatusInfo(job.status).color
                          }`}
                      >
                        {getStatusInfo(job.status).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {toJalali(new Date(job.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-0">
                        <button
                          onClick={() => openViewModal(job)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="مشاهده جزئیات و تصاویر"
                        >
                          <Eye size={14} />
                        </button>
                        <Link
                          href={`/admin/jobs/${job.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="ویرایش"
                        >
                          <Edit size={14} />
                        </Link>
                        {(job.status === "PENDING" || job.status === "PAID") && (
                          <>
                            <button
                              onClick={() =>
                                handleAction(job.id, job.status === "PAID" ? "final_approve" : "approve")
                              }
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              title="تأیید"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedJob(job.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              title="رد / نیاز به اصلاح"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {job.status === "APPROVED" && (
                          <>
                            <button
                              onClick={() => {
                                if (confirm("آیا از بازگردانی وضعیت این شغل به «در حال بررسی» اطمینان دارید؟"))
                                  handleAction(job.id, "revert_to_pending");
                              }}
                              className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                              title="بازگردانی به در حال بررسی"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedJob(job.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              title="رد / نیاز به اصلاح"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {job.status !== "FINAL" && job.status !== "DISABLED" && (
                          <button
                            onClick={() => {
                              if (confirm("آیا از تایید نهایی این شغل اطمینان دارید؟"))
                                handleAction(job.id, "final_approve");
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="تایید نهایی دستی"
                          >
                            <CheckCheck size={14} />
                          </button>
                        )}
                        {job.status === "DISABLED" ? (
                          <button
                            onClick={() => {
                              if (confirm("آیا از فعال‌سازی مجدد این شغل اطمینان دارید؟"))
                                handleAction(job.id, "enable");
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                            title="فعال‌سازی مجدد"
                          >
                            <Power size={14} />
                          </button>
                        ) : (
                          (job.status === "FINAL" ||
                            job.status === "APPROVED" ||
                            job.status === "PAID") && (
                            <button
                              onClick={() => {
                                if (confirm("آیا از غیرفعال کردن این شغل اطمینان دارید؟"))
                                  handleAction(job.id, "disable");
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="غیرفعال کردن"
                            >
                              <PowerOff size={14} />
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Note Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedJob(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-scale-in">
            <h3 className="text-base font-bold text-gray-800 mb-4">دلیل رد / نیاز به اصلاح</h3>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="دلیل خود را بنویسید..."
              className="w-full h-28 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleAction(selectedJob, "reject");
                  setSelectedJob(null);
                  setAdminNote("");
                }}
                className="flex-1 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors"
              >
                رد شغل
              </button>
              <button
                onClick={() => {
                  handleAction(selectedJob, "needs_edit");
                  setSelectedJob(null);
                  setAdminNote("");
                }}
                className="flex-1 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors"
              >
                اصلاح شود
              </button>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setAdminNote("");
                }}
                className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors"
              >
                لغو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal with Subscriptions & Images */}
      {viewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewJob(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col dir-rtl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div>
                <h3 className="text-base font-bold text-gray-900">{viewJob.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  گروه: {viewJob.category} {viewJob.subCategory ? `> ${viewJob.subCategory}` : ""}
                </p>
              </div>
              <button
                onClick={() => setViewJob(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Subscriptions Section */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <Zap size={16} className="text-emerald-600" />
                  اطلاعات اشتراک و خدمات انتخابی کاربر:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-gray-500">نوع اشتراک:</span>
                    <span className="font-bold text-emerald-800">
                      {getSubscriptionLabel(viewJob.subscriptionType)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-gray-500">اشتراک ویژه (VIP):</span>
                    <span
                      className={`font-bold ${viewJob.isVip ? "text-amber-600" : "text-gray-500"
                        }`}
                    >
                      {viewJob.isVip ? "🌟 فعال (نمایش در گروه اصلی)" : "غیرفعال"}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-gray-500">پله شدن آگهی (Boost):</span>
                    <span
                      className={`font-bold ${viewJob.isBoosted ? "text-purple-600" : "text-gray-500"
                        }`}
                    >
                      {viewJob.isBoosted
                        ? `🚀 فعال (${getBoostPeriodLabel(viewJob.boostPeriod)})`
                        : "غیرفعال"}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-gray-500">وضعیت آگهی:</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${getStatusInfo(viewJob.status).color
                        }`}
                    >
                      {getStatusInfo(viewJob.status).label}
                    </span>
                  </div>
                  {viewJob.isBoosted && viewJob.boostExpiresAt && (
                    <div className="sm:col-span-2 bg-white p-2.5 rounded-lg border border-purple-100 flex items-center justify-between">
                      <span className="text-gray-500">تاریخ پایان پله (Boost):</span>
                      <span className="font-bold text-purple-900">
                        {toJalali(new Date(viewJob.boostExpiresAt))}
                      </span>
                    </div>
                  )}
                  {viewJob.expiresAt && (
                    <div className="sm:col-span-2 bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                      <span className="text-gray-500">تاریخ انقضای اشتراک:</span>
                      <span className="font-bold text-gray-800">
                        {toJalali(new Date(viewJob.expiresAt))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Images Section */}
              {loadingImages ? (
                <div className="border-t border-gray-100 pt-4 text-center py-6">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-xs text-gray-400 mt-2">در حال بارگذاری تصاویر...</p>
                </div>
              ) : viewJobImages.length > 0 ? (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                    <ImageIcon size={16} className="text-blue-600" />
                    تصاویر ثبت‌شده شغل ({viewJobImages.length} تصویر):
                  </h4>

                  {/* Main Display */}
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative max-h-72 w-full max-w-lg mx-auto border border-gray-100 flex items-center justify-center">
                    <img
                      src={viewJobImages[viewModalImageIndex]?.url}
                      alt={viewJob.title}
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0.3';
                      }}
                      className="w-full h-full object-contain"
                    />
                    {viewJobImages[viewModalImageIndex]?.isMain && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-md shadow">
                        تصویر اصلی
                      </span>
                    )}

                    {viewJobImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setViewModalImageIndex(Math.max(0, viewModalImageIndex - 1))
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setViewModalImageIndex(
                              Math.min(viewJobImages.length - 1, viewModalImageIndex + 1)
                            )
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center rotate-180"
                        >
                          <ChevronLeft size={16} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails Strip */}
                  {viewJobImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {viewJobImages.map((img: any, idx: number) => (
                        <button
                          key={img.id || idx}
                          type="button"
                          onClick={() => setViewModalImageIndex(idx)}
                          className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all relative ${idx === viewModalImageIndex
                            ? "border-primary shadow-sm"
                            : "border-gray-200 opacity-70"
                            }`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          {img.isMain && (
                            <span className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-[8px] text-center font-bold py-0.5">
                              اصلی
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-4 text-center py-4 bg-gray-50 rounded-xl text-gray-400 text-xs">
                  هیچ تصاویری برای این شغل ثبت نشده است.
                </div>
              )}

              {/* Details & Contacts */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <h4 className="font-bold text-gray-800 text-xs">اطلاعات شغل و اطلاعات تماس:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block mb-1">صاحب شغل:</span>
                    <span className="font-semibold text-gray-800">{viewJob.user}</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block mb-1">
                      {viewJob.phone && viewJob.phone.includes(",") ? "شماره‌های تماس:" : "شماره تماس:"}
                    </span>
                    {viewJob.phone ? (
                      <div className="space-y-0.5" dir="ltr">
                        {viewJob.phone.split(/[,،\n]+/).map((ph: string, i: number) => (
                          <div key={i} className="font-semibold text-gray-800 font-mono text-xs">
                            {ph.trim()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="font-semibold text-gray-800">-</span>
                    )}
                  </div>
                  {viewJob.address && (
                    <div className="sm:col-span-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="text-gray-500 block mb-1">آدرس پستی:</span>
                      <span className="font-medium text-gray-800">{viewJob.address}</span>
                    </div>
                  )}
                  {viewJob.email && (
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="text-gray-500 block mb-1">ایمیل:</span>
                      <span className="font-medium text-blue-600 dir-ltr">{viewJob.email}</span>
                    </div>
                  )}
                  {viewJob.website && (
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="text-gray-500 block mb-1">وب‌سایت:</span>
                      <a
                        href={viewJob.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 dir-ltr truncate block"
                      >
                        {viewJob.website}
                      </a>
                    </div>
                  )}
                </div>

                {viewJob.description && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                    <span className="text-xs text-gray-500 block mb-1">توضیحات کامل شغل:</span>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {viewJob.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/80 flex justify-between items-center">
              <Link
                href={`/admin/jobs/${viewJob.id}/edit`}
                className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Edit size={14} />
                ویرایش کامل شغل
              </Link>
              <button
                type="button"
                onClick={() => setViewJob(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
