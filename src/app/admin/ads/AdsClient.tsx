"use client";

import { useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Trash2, Edit, PowerOff, Power, CheckCheck } from "lucide-react";
import Link from "next/link";

import { toJalali } from "@/lib/utils";

export default function AdsClient({ initialAds }: { initialAds: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedAd, setSelectedAd] = useState<number | null>(null);
  const [viewAd, setViewAd] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [ads, setAds] = useState(initialAds);

  const filteredAds = ads.filter((ad) => {
    const matchSearch = ad.title.includes(searchTerm) || ad.user.includes(searchTerm);
    const matchStatus = statusFilter === "ALL" || ad.status === statusFilter;
    const matchType = typeFilter === "ALL" || ad.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const getStatusInfo = (ad: any) => {
    switch (ad.status) {
      case 'FINAL': return { label: 'تایید نهایی', color: 'bg-green-100 text-green-700' };
      case 'APPROVED': return { label: 'تایید اولیه', color: 'bg-blue-100 text-blue-700' };
      case 'PAID': return { label: 'پرداخت شده', color: 'bg-purple-100 text-purple-700' };
      case 'PENDING': return { label: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-700' };
      case 'REJECTED':
        if (ad.adminNote && ad.adminNote.startsWith('[NEEDS_EDIT]')) {
          return { label: 'نیاز به اصلاح', color: 'bg-orange-100 text-orange-700' };
        }
        if (ad.adminNote && ad.adminNote.startsWith('[DISABLED]')) {
          return { label: 'غیرفعال', color: 'bg-gray-100 text-gray-600' };
        }
        return { label: 'رد شده', color: 'bg-red-100 text-red-700' };
      case 'EXPIRED': return { label: 'منقضی', color: 'bg-gray-100 text-gray-600' };
      default: return { label: ad.status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getAdTypeInfo = (type: string) => {
    switch (type) {
      case 'EMPLOYMENT': return { label: 'استخدام', color: 'bg-green-100 text-green-700' };
      case 'JOB_SEEKER': return { label: 'جویای کار', color: 'bg-blue-100 text-blue-700' };
      case 'COMMERCIAL': return { label: 'تجاری', color: 'bg-amber-100 text-amber-700' };
      case 'COMMERCIAL_FREE': return { label: 'تجاری رایگان', color: 'bg-gray-100 text-gray-700' };
      default: return { label: type, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/ads/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" })
      });
      if (res.ok) {
        const data = await res.json();
        setAds(ads.map(a => a.id === id ? { ...a, status: data.ad.status } : a));
        // Removed success alert
      } else {
        alert("خطا در تأیید آگهی");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleFinalApprove = async (id: number) => {
    if (!confirm("آیا از تایید نهایی این آگهی اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/ads/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FINAL" })
      });
      if (res.ok) {
        const data = await res.json();
        setAds(ads.map(a => a.id === id ? { ...a, status: data.ad.status } : a));
      } else {
        alert("خطا در تأیید نهایی آگهی");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleEnableAd = async (ad: any) => {
    if (!confirm("آیا از فعال‌سازی مجدد این آگهی اطمینان دارید؟")) return;

    let targetStatus = "FINAL";
    if (ad.adminNote && ad.adminNote.startsWith("[DISABLED]:")) {
      targetStatus = ad.adminNote.replace("[DISABLED]:", "");
    }

    try {
      const res = await fetch(`/api/admin/ads/${ad.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus, adminNote: null })
      });
      if (res.ok) {
        const data = await res.json();
        setAds(ads.map(a => a.id === ad.id ? { ...a, status: data.ad.status, adminNote: data.ad.adminNote } : a));
      } else {
        alert("خطا در فعال‌سازی آگهی");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleReject = async (type: "reject" | "needs_edit" | "disable", id?: number) => {
    const targetId = id || selectedAd;
    if (!targetId) return;

    const targetAd = ads.find(a => a.id === targetId);

    if (type !== "disable" && (!selectedAd || !adminNote.trim())) {
      alert("لطفا دلیل را وارد کنید");
      return;
    }
    const finalNote = type === "needs_edit"
      ? `[NEEDS_EDIT] ${adminNote}`
      : (type === "disable" ? `[DISABLED]:${targetAd?.status || "FINAL"}` : adminNote);
    try {
      const res = await fetch(`/api/admin/ads/${targetId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", adminNote: finalNote })
      });
      if (res.ok) {
        setAds(ads.map(a => a.id === targetId ? { ...a, status: "REJECTED", adminNote: finalNote } : a));
        setSelectedAd(null);
        setAdminNote("");
      } else {
        alert("خطا در عملیات");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این آگهی اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAds(ads.filter(a => a.id !== id));
        // Removed success alert
      } else {
        alert("خطا در حذف آگهی");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">مدیریت آگهی‌ها</h1>
        <span className="text-sm text-gray-500">{filteredAds.length} آگهی</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در آگهی‌ها..."
            className="w-full pr-9 pl-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="ALL">همه انواع</option>
          <option value="COMMERCIAL">تجاری</option>
          <option value="COMMERCIAL_FREE">تجاری رایگان</option>
          <option value="EMPLOYMENT">استخدام</option>
          <option value="JOB_SEEKER">جویای کار</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="ALL">همه وضعیت‌ها</option>
          <option value="PENDING">در حال بررسی</option>
          <option value="APPROVED">تأیید شده</option>
          <option value="PAID">پرداخت شده</option>
          <option value="FINAL">تأیید نهایی</option>
          <option value="REJECTED">رد شده</option>
          <option value="EXPIRED">منقضی</option>
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
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">نوع</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">وضعیت</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">تاریخ</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.map((ad) => (
                <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{ad.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{ad.title}</td>
                  <td className="px-4 py-3 text-gray-600">{ad.user}</td>
                  <td className="px-4 py-3 text-gray-600">{ad.city}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-semibold rounded-lg ${getAdTypeInfo(ad.type).color}`}>{getAdTypeInfo(ad.type).label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-semibold rounded-lg ${getStatusInfo(ad).color}`}>{getStatusInfo(ad).label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{toJalali(new Date(ad.createdAt))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewAd(ad)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="مشاهده">
                        <Eye size={14} />
                      </button>
                      <Link href={`/admin/ads/${ad.id}/edit`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="ویرایش">
                        <Edit size={14} />
                      </Link>
                      {ad.status === "PENDING" && (
                        <>
                          <button onClick={() => handleApprove(ad.id)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="تأیید">
                            <CheckCircle size={14} />
                          </button>
                          <button onClick={() => setSelectedAd(ad.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="رد">
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      {ad.status !== "FINAL" && !(ad.adminNote && ad.adminNote.startsWith('[DISABLED]')) && (
                        <button onClick={() => handleFinalApprove(ad.id)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="تایید نهایی دستی">
                          <CheckCheck size={14} />
                        </button>
                      )}
                      {ad.adminNote && ad.adminNote.startsWith('[DISABLED]') ? (
                        <button onClick={() => handleEnableAd(ad)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="فعال‌سازی مجدد">
                          <Power size={14} />
                        </button>
                      ) : (
                        (ad.status === "FINAL" || ad.status === "APPROVED" || ad.status === "PAID") && (
                          <button onClick={() => { if (confirm("آیا از غیرفعال کردن این آگهی اطمینان دارید؟")) handleReject("disable", ad.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="غیرفعال کردن">
                            <PowerOff size={14} />
                          </button>
                        )
                      )}
                      <button onClick={() => handleDelete(ad.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="حذف">
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

      {/* Reject Modal */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedAd(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-scale-in">
            <h3 className="text-base font-bold text-gray-800 mb-4">دلیل رد / نیاز به اصلاح</h3>
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
              placeholder="دلیل خود را بنویسید..."
              className="w-full h-28 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => handleReject("reject")}
                className="flex-1 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors">رد آگهی</button>
              <button onClick={() => handleReject("needs_edit")}
                className="flex-1 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">نیاز به اصلاح</button>
              <button onClick={() => { setSelectedAd(null); setAdminNote(""); }}
                className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors">لغو</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewAd(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">جزئیات آگهی</h3>
              <button onClick={() => setViewAd(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 block mb-1">عنوان</span>
                <p className="font-semibold text-gray-800">{viewAd.title}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">توضیحات</span>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl min-h-[100px] whitespace-pre-wrap">{viewAd.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">نوع آگهی</span>
                  <p className="text-sm font-medium text-gray-800">{getAdTypeInfo(viewAd.type).label}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">وضعیت</span>
                  <p className="text-sm font-medium text-gray-800">{getStatusInfo(viewAd).label}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">کاربر</span>
                  <p className="text-sm font-medium text-gray-800">{viewAd.user}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">شهر</span>
                  <p className="text-sm font-medium text-gray-800">{viewAd.city}</p>
                </div>
                {viewAd.adminNote && (
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 block mb-1">دلیل رد / یادداشت ادمین</span>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                      {viewAd.adminNote.replace('[NEEDS_EDIT] ', '')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
