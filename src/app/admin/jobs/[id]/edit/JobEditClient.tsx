"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function JobEditClient({ job, categories, cities }: { job: any, categories: any[], cities: any[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [categoryId, setCategoryId] = useState(job.categoryId);
  const activeCategory = categories.find(c => c.id === categoryId);
  const subCategories = activeCategory ? activeCategory.subCategories : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      phone: formData.get("phone") || null,
      address: formData.get("address") || null,
      email: formData.get("email") || null,
      website: formData.get("website") || null,
      whatsapp: formData.get("whatsapp") || null,
      telegram: formData.get("telegram") || null,
      instagram: formData.get("instagram") || null,
      workHours: formData.get("workHours") || null,
      cityId: parseInt(formData.get("cityId") as string),
      categoryId: parseInt(formData.get("categoryId") as string),
      subCategoryId: parseInt(formData.get("subCategoryId") as string),
    };

    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        router.push("/admin/jobs");
        router.refresh();
      } else {
        const errData = await res.json();
        alert(errData.error || "خطا در ذخیره شغل");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">عنوان شغل</label>
          <input type="text" name="title" defaultValue={job.title} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">شهر</label>
          <select name="cityId" defaultValue={job.cityId} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none bg-white">
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">دسته بندی</label>
          <select name="categoryId" value={categoryId} onChange={e => setCategoryId(parseInt(e.target.value))} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none bg-white">
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">زیردسته</label>
          <select name="subCategoryId" defaultValue={job.subCategoryId} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none bg-white">
            {subCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">تلفن</label>
          <input type="text" name="phone" defaultValue={job.phone || ""} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">ایمیل</label>
          <input type="email" name="email" defaultValue={job.email || ""} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">وب‌سایت</label>
          <input type="url" name="website" defaultValue={job.website || ""} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">واتساپ</label>
          <input type="text" name="whatsapp" defaultValue={job.whatsapp || ""} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">تلگرام</label>
          <input type="text" name="telegram" defaultValue={job.telegram || ""} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">اینستاگرام</label>
          <input type="text" name="instagram" defaultValue={job.instagram || ""} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" dir="ltr" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">آدرس</label>
        <textarea name="address" defaultValue={job.address || ""} className="w-full h-20 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">ساعات کاری</label>
        <textarea name="workHours" defaultValue={job.workHours || ""} className="w-full h-20 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">توضیحات</label>
        <textarea name="description" defaultValue={job.description} required className="w-full h-40 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
        <Link href="/admin/jobs" className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2">
          <ArrowRight size={16} /> بازگشت
        </Link>
        <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50">
          <Save size={18} /> {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </form>
  );
}
