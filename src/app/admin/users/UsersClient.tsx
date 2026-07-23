"use client";

import { useState, useEffect } from "react";
import { Search, Eye, CheckCircle, XCircle, Trash2, Shield, UserCheck, X, Briefcase, FileText, RefreshCw } from "lucide-react";
import { toJalali } from "@/lib/utils";

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const filteredUsers = users.filter((u) =>
    u.mobile.includes(searchTerm) || (u.username && u.username.includes(searchTerm))
  );

  const handleToggleActive = async (user: any) => {
    const actionText = user.isActive ? "غیرفعال کردن" : "فعال کردن";
    if (!confirm(`آیا از ${actionText} این کاربر اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u.id === user.id ? { ...u, isActive: data.user.isActive } : u));
        if (viewUser && viewUser.id === user.id) {
          setViewUser((prev: any) => ({ ...prev, isActive: data.user.isActive }));
        }
      } else {
        alert(data.error || "خطا در تغییر وضعیت کاربر.");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleToggleRole = async (user: any) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    const roleText = newRole === "ADMIN" ? "مدیر" : "کاربر عادی";
    if (!confirm(`آیا از تغییر نقش کاربر به "${roleText}" اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u.id === user.id ? { ...u, role: data.user.role } : u));
        if (viewUser && viewUser.id === user.id) {
          setViewUser((prev: any) => ({ ...prev, role: data.user.role }));
        }
      } else {
        alert(data.error || "خطا در تغییر نقش کاربر.");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("آیا از حذف این کاربر اطمینان دارید؟ این عمل قابل بازگشت نیست.")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        if (viewUser && viewUser.id === id) setViewUser(null);
      } else {
        alert(data.error || "خطا در حذف کاربر.");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleViewUser = async (user: any) => {
    setViewUser(user);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setViewUser(data.user);
      }
    } catch (e) {
      // keep basic user if details fetch fails
    } finally {
      setIsLoadingDetails(false);
    }
  };

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
        <div style={{ overflowX: 'scroll', WebkitOverflowScrolling: 'touch' }}>
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
                  <td className="px-4 py-3 text-gray-800 font-mono text-xs" dir="ltr">{user.mobile}</td>
                  <td className="px-4 py-3 text-gray-600">{user.username || "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleRole(user)}
                      title="جهت تغییر نقش کلیک کنید"
                      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer hover:shadow-xs active:scale-95 ${user.role === "ADMIN"
                        ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      <Shield size={12} className="shrink-0" />
                      <span>{user.role === "ADMIN" ? "مدیر" : "کاربر"}</span>
                      <RefreshCw size={10} className="opacity-50 group-hover:rotate-180 transition-transform duration-300 mr-0.5" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-medium">{user.jobCount ?? user.jobs?.length ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600 font-medium">{user.adCount ?? user.ads?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                      {user.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{toJalali(new Date(user.createdAt))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="مشاهده جزئیات"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`p-1.5 rounded-lg transition-colors ${user.isActive
                          ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          }`}
                        title={user.isActive ? "غیرفعال کردن" : "فعال کردن"}
                      >
                        {user.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف کاربر"
                      >
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

      {/* View User Details Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserCheck size={20} className="text-primary" />
                جزئیات کاربر
              </h3>
              <button onClick={() => setViewUser(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">شماره موبایل</span>
                  <p className="font-mono font-bold text-gray-800 text-sm" dir="ltr">{viewUser.mobile}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">نام کاربری</span>
                  <p className="font-semibold text-gray-800 text-sm">{viewUser.username || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">نقش سیستم</span>
                  <button
                    type="button"
                    onClick={() => handleToggleRole(viewUser)}
                    title="جهت تغییر نقش کلیک کنید"
                    className={`group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer hover:shadow-xs active:scale-95 ${viewUser.role === "ADMIN"
                      ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                  >
                    <Shield size={14} className="shrink-0 text-purple-600" />
                    <span>{viewUser.role === "ADMIN" ? "مدیر سیستم" : "کاربر معمولی"}</span>
                    <RefreshCw size={11} className="opacity-60 group-hover:rotate-180 transition-transform duration-300 mr-0.5 text-gray-400" />
                  </button>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">وضعیت حساب</span>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(viewUser)}
                    title="جهت تغییر وضعیت کلیک کنید"
                    className={`group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer hover:shadow-xs active:scale-95 ${viewUser.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      }`}
                  >
                    {viewUser.isActive ? <CheckCircle size={14} className="shrink-0 text-emerald-600" /> : <XCircle size={14} className="shrink-0 text-rose-600" />}
                    <span>{viewUser.isActive ? "حساب فعال" : "حساب غیرفعال"}</span>
                    <RefreshCw size={11} className="opacity-60 group-hover:rotate-180 transition-transform duration-300 mr-0.5 text-gray-400" />
                  </button>
                </div>
                <div className="col-span-full border-t border-gray-300 pt-2 mt-1">
                  <span className="text-xs text-gray-400 block mb-1">تاریخ عضویت</span>
                  <p className="text-xs text-gray-600 font-medium">{toJalali(new Date(viewUser.createdAt))}</p>
                </div>
              </div>

              {isLoadingDetails ? (
                <div className="py-6 text-center text-xs text-gray-400">در حال دریافت لیست آگهی‌ها و مشاغل...</div>
              ) : (
                <div className="space-y-4 pt-2">
                  {/* Jobs list */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <Briefcase size={14} className="text-blue-500" />
                      مشاغل کاربر ({viewUser.jobs?.length || 0})
                    </h4>
                    {viewUser.jobs && viewUser.jobs.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {viewUser.jobs.map((job: any) => (
                          <div key={job.id} className="flex items-center justify-between p-2 text-xs bg-gray-50 rounded-lg border border-gray-100">
                            <span className="font-semibold text-gray-700 truncate">{job.title}</span>
                            <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">{job.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded-lg text-center">مشاغلی ثبت نشده است.</p>
                    )}
                  </div>

                  {/* Ads list */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <FileText size={14} className="text-amber-500" />
                      آگهی‌های کاربر ({viewUser.ads?.length || 0})
                    </h4>
                    {viewUser.ads && viewUser.ads.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {viewUser.ads.map((ad: any) => (
                          <div key={ad.id} className="flex items-center justify-between p-2 text-xs bg-gray-50 rounded-lg border border-gray-100">
                            <span className="font-semibold text-gray-700 truncate">{ad.title}</span>
                            <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">{ad.type} | {ad.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded-lg text-center">آگهی ثبت نشده است.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
