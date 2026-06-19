"use client";

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import React from "react";

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  
  const { categories: jobCategories, isLoading: isCategoriesLoading } = useCategories();
  const { data: session } = useSession();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState("");

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setJob(data);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (job && jobCategories.length > 0 && selectedCategoryIndex === null) {
      const cIndex = jobCategories.findIndex(c => c.id === job.categoryId);
      if (cIndex !== -1) {
        setSelectedCategoryIndex(cIndex);
        const sub = jobCategories[cIndex].subCategories.find(s => s.id === job.subCategoryId);
        if (sub) {
          setSelectedSubCategorySlug(sub.slug);
        }
      }
    }
  }, [job, jobCategories, selectedCategoryIndex]);

  const selectedCategory = selectedCategoryIndex !== null ? jobCategories[selectedCategoryIndex] : null;

  const handleSubmit = async () => {
    if (selectedCategoryIndex === null || !selectedSubCategorySlug) {
      alert("لطفاً گروه و دسته شغلی را انتخاب کنید.");
      return;
    }
    
    const realCategoryId = selectedCategory?.id;
    const realSubCategoryId = selectedCategory?.subCategories.find(s => s.slug === selectedSubCategorySlug)?.id;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: realCategoryId,
          subCategoryId: realSubCategoryId
        })
      });
      if (res.ok) {
        alert("اطلاعات با موفقیت بروزرسانی شد.");
        router.push("/profile");
      } else {
        alert("خطا در بروزرسانی اطلاعات.");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isCategoriesLoading) {
    return <div className="min-h-screen flex items-center justify-center">در حال بارگذاری...</div>;
  }

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center">شغل یافت نشد</div>;
  }

  if (!session || (job.userId !== parseInt(session.user.id) && session.user.role !== "ADMIN")) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">عدم دسترسی</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <a href="/" className="hover:text-primary">خانه</a>
          <ChevronLeft size={12} />
          <a href="/profile" className="hover:text-primary">پروفایل کاربری</a>
          <ChevronLeft size={12} />
          <span className="text-gray-700">ویرایش اطلاعات شغلی</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
            <div>
              <h1 className="text-xl font-black text-gray-800">ویرایش گروه شغلی</h1>
              <p className="text-sm text-gray-500 mt-1">شما در حال ویرایش "{job.title}" هستید.</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-800 leading-relaxed">
              شما می‌توانید گروه و دسته‌بندی شغلی خود را ویرایش کنید. این تغییرات نیاز به تایید مجدد ادمین ندارند و فوراً اعمال می‌شوند. ویرایش سایر اطلاعات در این مرحله امکان‌پذیر نیست.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">گروه شغلی *</label>
                <select value={selectedCategoryIndex ?? ""}
                  onChange={(e) => {
                    setSelectedCategoryIndex(e.target.value ? parseInt(e.target.value) : null);
                    setSelectedSubCategorySlug("");
                  }}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                  <option value="">انتخاب کنید...</option>
                  {jobCategories.map((cat, index) => (
                    <option key={cat.id} value={index}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">دسته شغلی *</label>
                <select value={selectedSubCategorySlug}
                  onChange={(e) => setSelectedSubCategorySlug(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={selectedCategoryIndex === null}>
                  <option value="">
                    {selectedCategoryIndex !== null ? "انتخاب دسته شغلی..." : "ابتدا گروه شغلی را انتخاب کنید..."}
                  </option>
                  {selectedCategory?.subCategories.map((sub) => (
                    <option key={sub.id} value={sub.slug}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => router.push("/profile")}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                انصراف
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {isSubmitting ? "در حال ذخیره..." : (
                  <>
                    <Save size={18} />
                    ذخیره تغییرات
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
