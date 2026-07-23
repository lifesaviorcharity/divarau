"use client";

import { useState } from "react";
import { Search, Filter, Eye, CheckCircle, XCircle, Edit, Trash2, ChevronDown, PowerOff, Power, CheckCheck } from "lucide-react";
import Link from "next/link";

import { toJalali } from "@/lib/utils";

export default function JobsClient({ initialJobs }: { initialJobs: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [viewJob, setViewJob] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const [jobs, setJobs] = useState(initialJobs);

  const filteredJobs = jobs.filter((job) => {
    const matchSearch = job.title.includes(searchTerm) || job.user.includes(searchTerm);
    const matchStatus = statusFilter === "ALL" || job.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAction = async (jobId: number, action: string) => {
    let newStatus = "";
    let alertMsg = "";
    const targetJob = jobs.find(j => j.id === jobId);

    switch (action) {
      case "approve":
        newStatus = "APPROVED"; alertMsg = `شغل ${jobId} تأیید اولیه شد و پیامک پرداخت ارسال شد.`; break;
      case "reject":
        if (!adminNote) { alert("لطفاً دلیل رد را وارد کنید"); return; }
        newStatus = "REJECTED"; alertMsg = `شغل ${jobId} رد شد.`; break;
      case "needs_edit":
        if (!adminNote) { alert("لطفاً نکات اصلاح را وارد کنید"); return; }
        newStatus = "NEEDS_EDIT"; alertMsg = `شغل ${jobId} جهت اصلاح به کاربر برگشت داده شد.`; break;
      case "final_approve":
        newStatus = "FINAL"; alertMsg = `شغل ${jobId} تأیید نهایی شد.`; break;
      case "enable":
        let restoreStatus = "FINAL";
        if (targetJob?.adminNote && targetJob.adminNote.startsWith("[DISABLED]:")) {
          restoreStatus = targetJob.adminNote.replace("[DISABLED]:", "");
        }
        newStatus = restoreStatus;
        alertMsg = `شغل ${jobId} فعال گردید.`;
        break;
      case "disable":
        newStatus = "DISABLED"; alertMsg = `شغل ${jobId} غیرفعال شد.`; break;
      default: return;
    }

    const noteToSend = action === "disable"
      ? `[DISABLED]:${targetJob?.status || "FINAL"}`
      : (action === "enable" ? null : adminNote);

    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote: noteToSend })
      });
      if (res.ok) {
        setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus, adminNote: noteToSend } : j));
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
        setJobs(jobs.filter(j => j.id !== id));
      } else {
        alert("خطا در حذف شغل");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const getStatusInfo = (statusStr: string) => {
    switch (statusStr) {
      case 'FINAL': return { label: 'تایید نهایی', color: 'bg-green-100 text-green-700' };
      case 'APPROVED': return { label: 'تایید اولیه', color: 'bg-blue-100 text-blue-700' };
      case 'PAID': return { label: 'پرداخت شده', color: 'bg-purple-100 text-purple-700' };
      case 'PENDING': return { label: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-700' };
      case 'REJECTED': return { label: 'رد شده', color: 'bg-red-100 text-red-700' };
      case 'NEEDS_EDIT': return { label: 'نیاز به اصلاح', color: 'bg-orange-100 text-orange-700' };
      case 'DISABLED': return { label: 'غیرفعال', color: 'bg-gray-100 text-gray-600' };
      default: return { label: statusStr, color: 'bg-gray-100 text-gray-700' };
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
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در مشاغل..."
            className="w-full pr-9 pl-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
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
        <div style={{ overflowX: 'scroll', WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">عنوان</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">کاربر</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">شهر</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">دسته</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">وضعیت</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">تاریخ</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{job.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{job.title}</td>
                  <td className="px-4 py-3 text-gray-600">{job.user}</td>
                  <td className="px-4 py-3 text-gray-600">{job.city}</td>
                  <td className="px-4 py-3 text-gray-600">{job.category}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-[10px] font-semibold rounded-lg whitespace-nowrap inline-block ${getStatusInfo(job.status).color}`}>
                      {getStatusInfo(job.status).label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{toJalali(new Date(job.createdAt))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewJob(job)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="مشاهده">
                        <Eye size={14} />
                      </button>
                      <Link href={`/admin/jobs/${job.id}/edit`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="ویرایش">
                        <Edit size={14} />
                      </Link>
                      {(job.status === "PENDING" || job.status === "PAID") && (
                        <>
                          <button onClick={() => handleAction(job.id, job.status === "PAID" ? "final_approve" : "approve")}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="تأیید">
                            <CheckCircle size={14} />
                          </button>
                          <button onClick={() => { setSelectedJob(job.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="رد">
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      {job.status !== "FINAL" && job.status !== "DISABLED" && (
                        <button onClick={() => { if (confirm("آیا از تایید نهایی این شغل اطمینان دارید؟")) handleAction(job.id, "final_approve"); }}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="تایید نهایی دستی">
                          <CheckCheck size={14} />
                        </button>
                      )}
                      {job.status === "DISABLED" ? (
                        <button onClick={() => { if (confirm("آیا از فعال‌سازی مجدد این شغل اطمینان دارید؟")) handleAction(job.id, "enable"); }}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="فعال‌سازی مجدد">
                          <Power size={14} />
                        </button>
                      ) : (
                        (job.status === "FINAL" || job.status === "APPROVED" || job.status === "PAID") && (
                          <button onClick={() => { if (confirm("آیا از غیرفعال کردن این شغل اطمینان دارید؟")) handleAction(job.id, "disable"); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="غیرفعال کردن">
                            <PowerOff size={14} />
                          </button>
                        )
                      )}
                      <button onClick={() => handleDelete(job.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="حذف">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
              placeholder="دلیل خود را بنویسید..."
              className="w-full h-28 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { handleAction(selectedJob, "reject"); setSelectedJob(null); setAdminNote(""); }}
                className="flex-1 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors">
                رد شغل
              </button>
              <button onClick={() => { handleAction(selectedJob, "needs_edit"); setSelectedJob(null); setAdminNote(""); }}
                className="flex-1 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors">
                اصلاح شود
              </button>
              <button onClick={() => { setSelectedJob(null); setAdminNote(""); }}
                className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                لغو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewJob(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">جزئیات شغل</h3>
              <button onClick={() => setViewJob(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 block mb-1">عنوان</span>
                <p className="font-semibold text-gray-800">{viewJob.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">وضعیت</span>
                  <p className="text-sm font-medium text-gray-800">{getStatusInfo(viewJob.status).label}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">کاربر</span>
                  <p className="text-sm font-medium text-gray-800">{viewJob.user}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">شهر</span>
                  <p className="text-sm font-medium text-gray-800">{viewJob.city}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">دسته بندی</span>
                  <p className="text-sm font-medium text-gray-800">{viewJob.category}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">تلفن</span>
                  <p className="text-sm font-medium text-gray-800" dir="ltr">{viewJob.phone || "-"}</p>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <span className="text-xs text-gray-500 block mb-1">توضیحات</span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewJob.description || "توضیحاتی ثبت نشده است."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
