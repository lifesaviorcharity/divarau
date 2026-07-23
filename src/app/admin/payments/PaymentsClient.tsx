"use client";

import { useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Download, CreditCard } from "lucide-react";

import { toJalali } from "@/lib/utils";

export default function PaymentsClient({ initialPayments }: { initialPayments: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const filteredPayments = initialPayments.filter((p) => {
    const matchSearch = p.user.includes(searchTerm) || p.refId.includes(searchTerm) || p.item.includes(searchTerm);
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchMethod = methodFilter === "ALL" || p.method === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  });

  const totalCompleted = initialPayments.filter(p => p.status === "COMPLETED" || p.status === "PAID").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = initialPayments.filter(p => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0);

  const getStatusInfo = (statusStr: string) => {
    switch (statusStr) {
      case 'PAID':
      case 'COMPLETED': return { label: 'موفق', color: 'bg-green-100 text-green-700' };
      case 'PENDING': return { label: 'در انتظار تأیید', color: 'bg-yellow-100 text-yellow-700' };
      case 'FAILED': return { label: 'ناموفق', color: 'bg-red-100 text-red-700' };
      case 'REFUNDED': return { label: 'مسترد', color: 'bg-purple-100 text-purple-700' };
      default: return { label: statusStr, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleExportExcel = () => {
    if (filteredPayments.length === 0) {
      alert("هیچ داده‌ای برای خروجی وجود ندارد.");
      return;
    }

    const headers = ["شناسه", "کاربر", "بابت", "مبلغ ($)", "روش پرداخت", "شماره مرجع", "وضعیت", "تاریخ"];
    
    const rows = filteredPayments.map((p) => [
      p.id,
      `"${(p.user || '').replace(/"/g, '""')}"`,
      `"${(p.item || '').replace(/"/g, '""')}"`,
      p.amount,
      p.method === "PAYPAL" ? "PayPal" : "دستی",
      `"${(p.refId || '').replace(/"/g, '""')}"`,
      `"${getStatusInfo(p.status).label}"`,
      `"${toJalali(new Date(p.createdAt))}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payments-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">مدیریت پرداخت‌ها</h1>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors shadow-md cursor-pointer"
          title="دانلود خروجی اکسل (CSV)"
        >
          <Download size={16} />
          خروجی Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">کل پرداخت‌های موفق</p>
          <p className="text-2xl font-black text-green-600">${totalCompleted.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">در انتظار تأیید</p>
          <p className="text-2xl font-black text-amber-600">${totalPending.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-2xl font-black text-gray-800">{initialPayments.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام، شماره مرجع یا عنوان..."
            className="w-full pr-9 pl-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="ALL">همه روش‌ها</option>
          <option value="PAYPAL">PayPal</option>
          <option value="MANUAL">دستی</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="ALL">همه وضعیت‌ها</option>
          <option value="COMPLETED">موفق</option>
          <option value="PENDING">در انتظار</option>
          <option value="FAILED">ناموفق</option>
          <option value="REFUNDED">مسترد</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div style={{ overflowX: 'scroll', WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">کاربر</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">بابت</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">مبلغ</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">روش</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">شماره مرجع</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">وضعیت</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">تاریخ</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((pay) => (
                <tr key={pay.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{pay.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{pay.user}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{pay.item}</p>
                    <p className="text-[10px] text-gray-400">{pay.type}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-800">${pay.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-semibold rounded-lg ${pay.method === "PAYPAL" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                      {pay.method || "نامشخص"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono" dir="ltr">{pay.refId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-semibold rounded-lg ${getStatusInfo(pay.status).color}`}>{getStatusInfo(pay.status).label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{toJalali(new Date(pay.createdAt))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="جزئیات">
                        <Eye size={14} />
                      </button>
                      {pay.status === "PENDING" && (
                        <button onClick={() => {}}
                          className="p-1 text-green-600 hover:bg-green-50 rounded" title="تأیید">
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
