"use client";

import { useState } from "react";
import { Send, Clock } from "lucide-react";
import { toJalali } from "@/lib/utils";

type Item = { id: number, type: 'job' | 'ad', title: string, expiresAt: string, user: string, email: string | null };

export default function ExpiringClient({ initialItems }: { initialItems: Item[] }) {
  const [items] = useState(initialItems);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(i => `${i.type}-${i.id}`)));
    }
  };

  const handleSendReminder = async () => {
    if (selected.size === 0) return;
    setIsSending(true);

    const payload = Array.from(selected).map(s => {
      const [type, id] = s.split('-');
      return { type, id: parseInt(id) };
    });

    try {
      const res = await fetch("/api/admin/expiring/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload })
      });
      if (res.ok) {
        alert("ایمیل‌های یادآوری با موفقیت ارسال شدند.");
        setSelected(new Set());
      } else {
        alert("خطا در ارسال ایمیل‌ها");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">گزارش انقضای مشاغل و آگهی‌ها</h1>
        <button 
          onClick={handleSendReminder}
          disabled={selected.size === 0 || isSending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Send size={18} />
          {isSending ? "در حال ارسال..." : `ارسال یادآوری (${selected.size})`}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100 shrink-0">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            لیست موارد در آستانه انقضا یا منقضی شده
          </span>
          <span className="text-xs text-gray-500">{items.length} مورد یافت شد</span>
        </div>

        <div style={{ overflowX: 'scroll', WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right w-10">
                  <input type="checkbox" onChange={toggleAll} checked={items.length > 0 && selected.size === items.length} className="w-4 h-4 accent-primary rounded" />
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">عنوان</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">نوع</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">کاربر</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">ایمیل</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">تاریخ انقضا</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isExpired = new Date(item.expiresAt).getTime() < Date.now();
                const key = `${item.type}-${item.id}`;
                return (
                  <tr key={key} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(key)} onChange={() => toggleSelect(key)} className="w-4 h-4 accent-primary rounded" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{item.title}</td>
                    <td className="px-4 py-3 text-gray-600">{item.type === 'job' ? 'شغل' : 'آگهی'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.user}</td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">{item.email || "ندارد"}</td>
                    <td className="px-4 py-3 text-gray-600">{toJalali(new Date(item.expiresAt))}</td>
                    <td className="px-4 py-3">
                      {isExpired ? (
                        <span className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-red-100 text-red-700">منقضی شده</span>
                      ) : (
                        <span className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-orange-100 text-orange-700">نزدیک انقضا</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    موردی یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
