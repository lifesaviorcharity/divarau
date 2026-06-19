"use client";

import { useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Trash2 } from "lucide-react";

import { toJalali } from "@/lib/utils";

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = initialUsers.filter((u) =>
    u.mobile.includes(searchTerm) || u.username?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">مدیریت کاربران</h1>
        <span className="text-sm text-gray-500">{filteredUsers.length} کاربر</span>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس موبایل یا نام کاربری..."
            className="w-full pr-9 pl-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">موبایل</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">نام کاربری</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">نقش</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">مشاغل</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">آگهی‌ها</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">وضعیت</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">تاریخ ثبت‌نام</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{user.id}</td>
                  <td className="px-4 py-3 text-gray-800 font-mono text-xs">{user.mobile}</td>
                  <td className="px-4 py-3 text-gray-600">{user.username || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {user.role === "ADMIN" ? "مدیر" : "کاربر"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.jobCount}</td>
                  <td className="px-4 py-3 text-gray-600">{user.adCount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${
                      user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {user.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{toJalali(new Date(user.createdAt))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="مشاهده">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title={user.isActive ? "غیرفعال" : "فعال"}>
                        {user.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="حذف">
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
    </div>
  );
}
