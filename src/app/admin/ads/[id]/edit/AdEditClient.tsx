"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdEditClient({ ad, categories, cities }: { ad: any, categories: any[], cities: any[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [categoryId, setCategoryId] = useState(ad.categoryId);
  const activeCategory = categories.find(c => c.id === categoryId);
  const subCategories = activeCategory ? activeCategory.subCategories : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      cityId: parseInt(formData.get("cityId") as string),
      categoryId: parseInt(formData.get("categoryId") as string),
      subCategoryId: parseInt(formData.get("subCategoryId") as string),
    };

    try {
      const res = await fetch(`/api/admin/ads/${ad.id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        router.push("/admin/ads");
        router.refresh();
      } else {
        const errData = await res.json();
        alert(errData.error || "خطا در ذخیره آگهی");
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
          <label className="block text-sm font-semibold text-gray-700 mb-1">عنوان آگهی</label>
          <input type="text" name="title" defaultValue={ad.title} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">شهر</label>
          <select name="cityId" defaultValue={ad.cityId} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none bg-white">
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
          <select name="subCategoryId" defaultValue={ad.subCategoryId} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none bg-white">
            {subCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">توضیحات</label>
        <textarea name="description" defaultValue={ad.description} required className="w-full h-40 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
        <Link href="/admin/ads" className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2">
          <ArrowRight size={16} /> بازگشت
        </Link>
        <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50">
          <Save size={18} /> {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </form>
  );
}
