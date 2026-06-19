"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCityStore } from "@/store/cityStore";
import { useCategories } from "@/hooks/useCategories";
import { ChevronLeft, AlertTriangle, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function FreeAdPage() {
  const router = useRouter();
  const { selectedCity, openCityModal } = useCityStore();
  const { categories: jobCategories, isLoading: isCategoriesLoading } = useCategories();
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const [adType, setAdType] = useState<"employment" | "job_seeker" | "commercial_free">("employment");
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // When "commercial_free" is selected, only show "خدمات عمومی"
  const availableCategories = adType === "commercial_free"
    ? jobCategories.filter((cat) => cat.name === "خدمات عمومی").map((cat, i) => ({
        ...cat,
        originalIndex: jobCategories.findIndex((c) => c.name === cat.name),
      }))
    : jobCategories.map((cat, i) => ({ ...cat, originalIndex: i }));

  // When "commercial_free", only show vehicles and home&kitchen
  const selectedCategory = selectedCategoryIndex !== null ? jobCategories[selectedCategoryIndex] : null;
  const availableSubCategories = adType === "commercial_free" && selectedCategory
    ? selectedCategory.subCategories.filter(
        (sub) => sub.slug === "vehicles" || sub.slug === "home-kitchen"
      )
    : selectedCategory?.subCategories || [];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCity) { openCityModal(); return; }
    if (!isLoggedIn) return;
    if (!title || !description || selectedCategoryIndex === null || !selectedSubCategorySlug) {
      alert("لطفاً تمامی فیلدهای اجباری را پر کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const realCategoryId = selectedCategory?.id;
      const realSubCategoryId = selectedCategory?.subCategories.find(s => s.slug === selectedSubCategorySlug)?.id;

      if (!realCategoryId || !realSubCategoryId) {
        alert("دسته بندی نامعتبر است");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: selectedCity.id,
          categoryId: realCategoryId,
          subCategoryId: realSubCategoryId,
          type: adType.toUpperCase(),
          title,
          description
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("آگهی شما با موفقیت ثبت شد و پس از بررسی نمایش داده خواهد شد.");
        router.push("/profile");
      } else {
        alert(data.error || "خطا در ثبت آگهی.");
      }
    } catch (err) {
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setTitle(""); setDescription(""); setSelectedCategoryIndex(null);
    setSelectedSubCategorySlug(""); setAdType("employment");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <a href="/" className="hover:text-primary">خانه</a>
          <ChevronLeft size={12} />
          <span className="text-gray-700">ثبت آگهی رایگان</span>
        </div>

        {/* Auth Warning */}
        {!isLoggedIn && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">
                لطفاً قبل از ثبت آگهی با حساب کاربری خود وارد شوید.
              </p>
              <div className="flex gap-2 mt-2">
                <a href="/auth/login" className="text-xs text-primary font-semibold hover:underline">ورود</a>
                <span className="text-gray-300">|</span>
                <a href="/auth/login" className="text-xs text-primary font-semibold hover:underline">ثبت‌نام</a>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-black text-primary text-center mb-6">ثبت آگهی رایگان</h2>

          <div className="space-y-5">
            {/* Ad Type Radio */}
            <div className="flex items-center justify-center gap-6 p-3 bg-gray-50 rounded-xl">
              {[
                { value: "employment" as const, label: "استخدام" },
                { value: "job_seeker" as const, label: "جویای کار" },
                { value: "commercial_free" as const, label: "تجاری رایگان" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="adType" checked={adType === opt.value}
                    onChange={() => {
                      setAdType(opt.value);
                      setSelectedCategoryIndex(null);
                      setSelectedSubCategorySlug("");
                    }}
                    className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">گروه شغلی *</label>
              <select value={selectedCategoryIndex ?? ""}
                onChange={(e) => {
                  setSelectedCategoryIndex(e.target.value ? parseInt(e.target.value) : null);
                  setSelectedSubCategorySlug("");
                }}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">انتخاب کنید...</option>
                {availableCategories.map((cat) => (
                  <option key={cat.originalIndex} value={cat.originalIndex}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* SubCategory */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">دسته شغلی *</label>
              <select value={selectedSubCategorySlug}
                onChange={(e) => setSelectedSubCategorySlug(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                disabled={selectedCategoryIndex === null}>
                <option value="">
                  {selectedCategoryIndex !== null ? "انتخاب دسته شغلی..." : "ابتدا گروه شغلی را انتخاب کنید..."}
                </option>
                {availableSubCategories.map((sub) => (
                  <option key={sub.slug} value={sub.slug}>{sub.name}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">عنوان آگهی *</label>
              <input type="text" value={title} maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان آگهی خود را بنویسید"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <p className="text-[10px] text-gray-400 mt-1">{title.length}/100 کاراکتر</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">توضیحات آگهی *</label>
              <textarea value={description} maxLength={800}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحات مربوط به آگهی را بنویسید"
                className="w-full h-32 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
              <p className="text-[10px] text-gray-400 mt-1">{description.length}/800 کاراکتر</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSubmit} disabled={!isLoggedIn || isSubmitting}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  isLoggedIn && !isSubmitting ? "bg-primary text-white hover:bg-primary-dark shadow-lg" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}>
                {isSubmitting ? "در حال ثبت..." : "ثبت آگهی"}
              </button>
              <button onClick={handleClear}
                className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
                <Trash2 size={14} />
                پاک کردن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
