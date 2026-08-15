"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowRight,
  Upload,
  X,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Star,
  Zap,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { compressImage } from "@/lib/compressImage";
import { limitDigits } from "@/lib/utils";

const parsePhones = (phoneStr: string | null | undefined) => {
  if (!phoneStr || !phoneStr.trim()) {
    return [{ countryCode: "+61", number: "" }];
  }
  const parts = phoneStr.split(/[,،\n]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    return [{ countryCode: "+61", number: "" }];
  }
  return parts.slice(0, 3).map((part) => {
    if (part.startsWith("+61")) {
      return { countryCode: "+61", number: part.replace(/^\+61\s*/, "") };
    }
    return { countryCode: "+61", number: part };
  });
};

export default function JobEditClient({
  job,
  categories,
  cities,
}: {
  job: any;
  categories: any[];
  cities: any[];
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSystemSettings(data))
      .catch(() => { });
  }, []);

  const maxImages = parseInt(systemSettings.maxImages || "6", 10);
  const maxImageSizeKB = parseInt(systemSettings.maxImageSize || "500", 10);

  const [categoryId, setCategoryId] = useState<number>(job.categoryId);
  const [subCategoryId, setSubCategoryId] = useState<number>(job.subCategoryId);
  const [cityId, setCityId] = useState<number>(job.cityId);

  const activeCategory = categories.find((c) => c.id === categoryId);
  const subCategories = activeCategory ? activeCategory.subCategories : [];

  const [formData, setFormData] = useState({
    title: job.title || "",
    description: job.description || "",
    address: job.address || "",
    email: job.email || "",
    website: job.website || "",
    whatsapp: job.whatsapp || "",
    telegram: job.telegram || "",
    instagram: job.instagram || "",
    workHours: job.workHours || "",
    status: job.status || "PENDING",
    subscriptionType: job.subscriptionType || "SIX_MONTHS",
    isVip: Boolean(job.isVip),
    isBoosted: Boolean(job.isBoosted),
    boostPeriod: job.boostPeriod || "ONE_DAY",
    adminNote: job.adminNote || "",
    expiresAt: job.expiresAt ? new Date(job.expiresAt).toISOString().split("T")[0] : "",
  });

  const [phoneList, setPhoneList] = useState<{ countryCode: string; number: string }[]>(
    parsePhones(job.phone)
  );

  // Images state
  const initialImages = job.images && job.images.length > 0
    ? job.images.map((img: any) => ({
      url: img.url,
      isMain: Boolean(img.isMain),
    }))
    : [];

  const [images, setImages] = useState<{ url: string; file?: File; isMain?: boolean }[]>(initialImages);
  const initialMainIdx = initialImages.findIndex((img: any) => img.isMain);
  const [mainImageIndex, setMainImageIndex] = useState(initialMainIdx !== -1 ? initialMainIdx : 0);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [isCompressing, setIsCompressing] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      alert(`حداکثر ${maxImages} تصویر مجاز است.`);
      return;
    }

    for (const file of Array.from(files)) {
      let finalFile = file;

      if (file.size > maxImageSizeKB * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const accepted = confirm(
          `حجم تصویر "${file.name}" (${sizeMB}MB) بیشتر از حد مجاز (${maxImageSizeKB}KB) است.\n\nآیا می‌خواهید سیستم حجم تصویر را به‌صورت خودکار کاهش دهد؟`
        );
        if (!accepted) continue;

        setIsCompressing(true);
        try {
          finalFile = await compressImage(file, maxImageSizeKB);
        } catch {
          alert(`خطا در فشرده‌سازی تصویر "${file.name}". لطفاً تصویر دیگری انتخاب کنید.`);
          continue;
        } finally {
          setIsCompressing(false);
        }
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setImages((prev) => [...prev, { url, file: finalFile }]);
      };
      reader.readAsDataURL(finalFile);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (mainImageIndex === index) {
      setMainImageIndex(0);
    } else if (mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("عنوان شغل الزامی است.");
      return;
    }

    setIsSaving(true);

    const formattedPhones = phoneList
      .map((p) => (p.number.trim() ? `${p.countryCode} ${p.number.trim()}` : ""))
      .filter(Boolean)
      .join(", ");

    const payload = {
      ...formData,
      phone: formattedPhones,
      cityId,
      categoryId,
      subCategoryId,
      images: images.map((img, i) => ({
        url: img.url,
        isMain: i === mainImageIndex,
      })),
    };

    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/jobs");
        router.refresh();
      } else {
        const errData = await res.json();
        alert(errData.error || "خطا در ذخیره تغییرات شغل.");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/jobs" className="hover:text-primary transition-colors">
            مدیریت مشاغل
          </Link>
          <ChevronLeft size={14} />
          <span className="font-semibold text-gray-800">ویرایش شغل #{job.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/jobs"
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-1.5"
          >
            <ArrowRight size={14} /> بازگشت
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save size={15} /> {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Images Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Images Management Box */}
          <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <ImagePlus size={16} className="text-primary" />
                تصاویر شغل ({images.length}/{maxImages})
              </h3>
              <span className="text-[10px] text-gray-400">حداکثر {maxImages} تصویر</span>
            </div>

            {/* Main Image Preview */}
            <div className="aspect-square bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative shadow-inner">
              {images.length > 0 ? (
                <img
                  src={images[mainImageIndex]?.url}
                  alt="تصویر اصلی شغل"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-400 p-4">
                  <ImagePlus size={44} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">هیچ تصویری برای این شغل ثبت نشده است</p>
                </div>
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setMainImageIndex(Math.max(0, mainImageIndex - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center hover:bg-white text-gray-700"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMainImageIndex(Math.min(images.length - 1, mainImageIndex + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center hover:bg-white text-gray-700 rotate-180"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </>
              )}

              {images.length > 0 && (
                <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-primary text-white rounded-md shadow-sm">
                  تصویر اصلی
                </span>
              )}
            </div>

            {/* Thumbnails Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {images.length < maxImages && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-white hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload size={16} className="text-primary" />
                  <span className="text-[9px] text-primary font-bold mt-1">افزودن</span>
                </label>
              )}

              {images.map((img, i) => (
                <div key={i} className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => setMainImageIndex(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all block ${i === mainImageIndex ? "border-primary ring-2 ring-primary/30 shadow-md" : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110"
                    title="حذف تصویر"
                  >
                    <X size={11} />
                  </button>
                  {i === mainImageIndex && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-primary text-white px-1.5 py-0.2 rounded-md shadow-xs">
                      اصلی
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-gray-500 leading-relaxed">
              💡 برای تنظیم یک تصویر به عنوان تصویر اصلی، روی تصویر بندانگشتی آن کلیک کنید.
            </p>
          </div>

          {/* Job Owner Card */}
          {job.user && (
            <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <User size={14} className="text-blue-600" />
                اطلاعات ثبت‌کننده شغل
              </h4>
              <div className="text-xs text-gray-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">نام کاربری:</span>
                  <span className="font-semibold">{job.user.username || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">شماره موبایل:</span>
                  <span className="font-mono" dir="ltr">{job.user.mobile || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ایمیل:</span>
                  <span className="font-mono text-[11px]" dir="ltr">{job.user.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">شناسه کاربر:</span>
                  <span className="font-mono text-gray-500">#{job.user.id}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right / Main Information & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Main Info */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
              اطلاعات اصلی شغل
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">عنوان شغل *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">شهر محل فعالیت *</label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(parseInt(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.slug ? `(${c.slug})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">گروه اصلی شغلی *</label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    const newCatId = parseInt(e.target.value);
                    setCategoryId(newCatId);
                    const newCat = categories.find((c) => c.id === newCatId);
                    if (newCat && newCat.subCategories.length > 0) {
                      setSubCategoryId(newCat.subCategories[0].id);
                    }
                  }}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">دسته شغلی (زیرمجموعه) *</label>
                <select
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(parseInt(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  {subCategories.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-phone numbers */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    شماره‌های تماس (حداکثر ۳ شماره)
                  </label>
                  {phoneList.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setPhoneList([...phoneList, { countryCode: "+61", number: "" }])}
                      className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus size={13} /> افزودن شماره دیگر
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {phoneList.map((ph, idx) => (
                    <div key={idx} className="flex items-center gap-2">

                      {/* Number Input Box */}
                      <input
                        type="tel"
                        value={ph.number}
                        onChange={(e) => {
                          const updated = [...phoneList];
                          updated[idx].number = limitDigits(e.target.value, 13);
                          setPhoneList(updated);
                        }}
                        maxLength={13}
                        placeholder={idx === 0 ? "مثلاً: 412345678 یا 0412345678" : "شماره تماس دیگر..."}
                        className="flex-1 px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr font-mono"
                      />

                      {/* Country Code Dropdown */}
                      <select
                        value={ph.countryCode}
                        onChange={(e) => {
                          const updated = [...phoneList];
                          updated[idx].countryCode = e.target.value;
                          setPhoneList(updated);
                        }}
                        className="w-25 px-2.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shrink-0"
                      >
                        <option value="+61">AU (+61)</option>
                      </select>

                      {/* Remove Button */}
                      {phoneList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPhoneList(phoneList.filter((_, i) => i !== idx))}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="حذف این شماره"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">آدرس ایمیل</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="info@example.com"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">وب‌سایت</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">واتساپ</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", limitDigits(e.target.value, 14))}
                  maxLength={14}
                  placeholder="04XXXXXXXX یا 614XXXXXXXX"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-left dir-ltr font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">تلگرام</label>
                <input
                  type="text"
                  value={formData.telegram}
                  onChange={(e) => handleInputChange("telegram", e.target.value)}
                  placeholder="username یا لینک"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اینستاگرام</label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => handleInputChange("instagram", e.target.value)}
                  placeholder="@page یا لینک"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">آدرس پستی</label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={2}
                placeholder="آدرس محل کسب‌وکار"
                className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ساعات کاری</label>
              <textarea
                value={formData.workHours}
                onChange={(e) => handleInputChange("workHours", e.target.value)}
                rows={2}
                placeholder="مثلاً: دوشنبه تا جمعه ۹ صبح تا ۵ عصر"
                className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">متن توضیحات شغل *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={5}
                required
                placeholder="توضیحات کامل درباره خدمات و معرفی شغل..."
                className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>
          </div>

          {/* Section 2: Admin Status & Subscription Controls */}
          <div className="bg-purple-50/40 border border-purple-200/70 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-1.5 border-b border-purple-100 pb-2">
              <Shield size={16} className="text-purple-600" />
              تنظیمات وضعیت، اشتراک و دسترسی ادمین
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">وضعیت شغل</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none font-semibold text-gray-800"
                >
                  <option value="PENDING">در حال بررسی (PENDING)</option>
                  <option value="APPROVED">تأیید اولیه (APPROVED)</option>
                  <option value="PAID">پرداخت شده (PAID)</option>
                  <option value="FINAL">تأیید نهایی و منتشر شده (FINAL)</option>
                  <option value="NEEDS_EDIT">نیاز به اصلاح کاربر (NEEDS_EDIT)</option>
                  <option value="REJECTED">رد شده (REJECTED)</option>
                  <option value="EXPIRED">منقضی شده (EXPIRED)</option>
                  <option value="DISABLED">غیرفعال توسط ادمین (DISABLED)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">نوع اشتراک</label>
                <select
                  value={formData.subscriptionType}
                  onChange={(e) => handleInputChange("subscriptionType", e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none"
                >
                  <option value="SIX_MONTHS">اشتراک ۶ ماهه</option>
                  <option value="TWELVE_MONTHS">اشتراک ۱۲ ماهه</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">تاریخ انقضا</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => handleInputChange("expiresAt", e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none dir-ltr"
                />
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <label className="flex items-center gap-2 p-2.5 bg-white border border-purple-200 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isVip}
                    onChange={(e) => handleInputChange("isVip", e.target.checked)}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <span className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    اشتراک ویژه (VIP)
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-white border border-purple-200 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isBoosted}
                    onChange={(e) => handleInputChange("isBoosted", e.target.checked)}
                    className="w-4 h-4 accent-amber-600"
                  />
                  <span className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                    <Zap size={13} className="text-amber-500 fill-amber-500" />
                    پله / نردبان شده (Boosted)
                  </span>
                </label>
              </div>
            </div>

            {formData.isBoosted && (
              <div className="bg-white border border-amber-200 rounded-xl p-3">
                <label className="block text-xs font-semibold text-amber-900 mb-2">مدت زمان پله شدن</label>
                <div className="flex gap-2">
                  {[
                    { val: "ONE_DAY", label: "۱ روزه" },
                    { val: "THREE_DAYS", label: "۳ روزه" },
                    { val: "SEVEN_DAYS", label: "۷ روزه" },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.val}
                      onClick={() => handleInputChange("boostPeriod", p.val)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${formData.boostPeriod === p.val
                        ? "border-amber-500 bg-amber-50 text-amber-800 font-bold"
                        : "border-gray-200 text-gray-600"
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                یادداشت یا دلیل ادمین (Admin Note)
              </label>
              <textarea
                value={formData.adminNote}
                onChange={(e) => handleInputChange("adminNote", e.target.value)}
                rows={2}
                placeholder="توضیح دلیل رد یا مواردی که باید توسط کاربر اصلاح شود..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Link
              href="/admin/jobs"
              className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <ArrowRight size={16} /> انصراف
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-7 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Save size={18} /> {isSaving ? "در حال ذخیره..." : "ذخیره تمامی تغییرات"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
