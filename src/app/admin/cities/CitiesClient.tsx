"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Save, X, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CitiesClient({ initialCities, countries }: { initialCities: any[], countries: any[] }) {
  const router = useRouter();
  const [cities, setCities] = useState(initialCities);

  const [modal, setModal] = useState<{ isOpen: boolean; mode: "add" | "edit"; data: any }>({ isOpen: false, mode: "add", data: null });

  const refreshData = () => {
    router.refresh();
    fetch("/api/admin/cities")
      .then(res => res.json())
      .then(data => setCities(data));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      countryId: parseInt(formData.get("countryId") as string)
    };

    try {
      const url = modal.mode === "add" ? "/api/admin/cities" : `/api/admin/cities/${modal.data.id}`;
      const method = modal.mode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const resData = await res.json();

      if (res.ok) {
        setModal({ isOpen: false, mode: "add", data: null });
        refreshData();
      } else {
        alert(resData.error || "خطا در ذخیره شهر");
      }
    } catch (e) {
      alert("خطای شبکه");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این شهر اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/cities/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        refreshData();
      } else {
        alert(data.error || "خطا در حذف");
      }
    } catch (e) {
      alert("خطای شبکه");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-800">مدیریت شهرها</h2>
        <button
          onClick={() => setModal({ isOpen: true, mode: "add", data: null })}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-bold rounded-xl hover:bg-secondary-dark transition-colors"
        >
          <Plus size={18} />
          افزودن شهر جدید
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100 shrink-0">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            لیست شهرها
          </span>
          <span className="text-xs text-gray-500">مجموع: {cities.length} شهر</span>
        </div>

        <div className="divide-y divide-gray-100 overflow-y-auto">
          {cities.map((city) => (
            <div key={city.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800 text-sm truncate">{city.name}</h3>
                  <span className="hidden sm:inline-block text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-mono truncate">{city.slug}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">
                  کشور: {city.country?.name} | {city._count?.jobs || 0} شغل | {city._count?.ads || 0} آگهی
                </p>
              </div>

              {/* Desktop Hover Actions */}
              <div className="hidden sm:flex items-center gap-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => setModal({ isOpen: true, mode: "edit", data: city })}
                  className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(city.id)}
                  className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Mobile Always-Visible Actions */}
              <div className="flex sm:hidden items-center gap-1 shrink-0 pl-1">
                <button onClick={() => setModal({ isOpen: true, mode: "edit", data: city })} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={14} /></button>
                <button onClick={() => handleDelete(city.id)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}

          {cities.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              هیچ شهری یافت نشد.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {modal.mode === "add" ? "افزودن شهر" : "ویرایش شهر"}
              </h3>
              <button onClick={() => setModal({ isOpen: false, mode: "add", data: null })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">نام شهر (فارسی)</label>
                  <input type="text" name="name" defaultValue={modal.data?.name} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">نام انگلیسی (Slug)</label>
                  <input type="text" name="slug" defaultValue={modal.data?.slug} required dir="ltr" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left" placeholder="e.g. sydney" />
                  <p className="text-[10px] text-gray-400 mt-1">این نام در آدرس (URL) استفاده می‌شود و باید یکتا باشد.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">کشور</label>
                  <select name="countryId" defaultValue={modal.data?.countryId || (countries.length > 0 ? countries[0].id : "")} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white">
                    {countries.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setModal({ isOpen: false, mode: "add", data: null })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">انصراف</button>
                <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2">
                  <Save size={16} /> ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
