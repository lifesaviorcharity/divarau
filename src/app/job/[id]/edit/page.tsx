"use client";

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Save,
  Upload,
  X,
  ImagePlus,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import React from "react";

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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    email: "",
    website: "",
    whatsapp: "",
    telegram: "",
    instagram: "",
    workHours: "",
  });

  const [phoneList, setPhoneList] = useState<{ countryCode: string; number: string }[]>([
    { countryCode: "+61", number: "" },
  ]);

  const [images, setImages] = useState<{ url: string; file?: File; isMain?: boolean }[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const [systemSettings, setSystemSettings] = useState<any>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSystemSettings(data))
      .catch(() => { });
  }, []);

  const maxImages = parseInt(systemSettings.maxImages || "3", 10);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setJob(data);
          setFormData({
            title: data.title || "",
            description: data.description || "",
            address: data.address || "",
            email: data.email || "",
            website: data.website || "",
            whatsapp: data.whatsapp || "",
            telegram: data.telegram || "",
            instagram: data.instagram || "",
            workHours: data.workHours || "",
          });

          setPhoneList(parsePhones(data.phone));

          if (data.images && data.images.length > 0) {
            const loadedImgs = data.images.map((img: any) => ({
              url: img.url,
              isMain: img.isMain,
            }));
            setImages(loadedImgs);
            const mainIdx = loadedImgs.findIndex((img: any) => img.isMain);
            if (mainIdx !== -1) setMainImageIndex(mainIdx);
          }
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (job && jobCategories.length > 0 && selectedCategoryIndex === null) {
      const cIndex = jobCategories.findIndex((c) => c.id === job.categoryId);
      if (cIndex !== -1) {
        setSelectedCategoryIndex(cIndex);
        const sub = jobCategories[cIndex].subCategories.find((s) => s.id === job.subCategoryId);
        if (sub) {
          setSelectedSubCategorySlug(sub.slug);
        }
      }
    }
  }, [job, jobCategories, selectedCategoryIndex]);

  const selectedCategory = selectedCategoryIndex !== null ? jobCategories[selectedCategoryIndex] : null;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > maxImages) {
      alert(`حداکثر ${maxImages} تصویر مجاز است`);
      return;
    }
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
        setImages((prev) => [...prev, { url, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (mainImageIndex === index) setMainImageIndex(0);
    else if (mainImageIndex > index) setMainImageIndex(mainImageIndex - 1);
  };

  const isFullEditAllowed = job && (job.status === "NEEDS_EDIT" || job.status === "REJECTED");

  const handleSubmit = async () => {
    if (selectedCategoryIndex === null || !selectedSubCategorySlug) {
      alert("لطفاً گروه و دسته شغلی را انتخاب کنید.");
      return;
    }

    const realCategoryId = selectedCategory?.id;
    const realSubCategoryId = selectedCategory?.subCategories.find(
      (s) => s.slug === selectedSubCategorySlug
    )?.id;

    const payload: any = {
      categoryId: realCategoryId,
      subCategoryId: realSubCategoryId,
    };

    if (isFullEditAllowed) {
      const formattedPhones = phoneList
        .map((p) => (p.number.trim() ? `${p.countryCode} ${p.number.trim()}` : ""))
        .filter(Boolean)
        .join(", ");

      if (!formData.title.trim() || !formData.description.trim() || !formattedPhones) {
        alert("لطفاً تمامی فیلدهای الزامی (عنوان، توضیحات و حداقل یک شماره تماس) را پر کنید.");
        return;
      }

      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          alert("فرمت ایمیل وارد شده نامعتبر است.");
          return;
        }
      }

      payload.title = formData.title;
      payload.description = formData.description;
      payload.phone = formattedPhones;
      payload.address = formData.address;
      payload.email = formData.email;
      payload.website = formData.website;
      payload.whatsapp = formData.whatsapp;
      payload.telegram = formData.telegram;
      payload.instagram = formData.instagram;
      payload.workHours = formData.workHours;
      payload.images = images.map((img, i) => ({
        url: img.url,
        isMain: i === mainImageIndex,
      }));
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (isFullEditAllowed) {
          alert("اصلاحات شما با موفقیت ثبت شد و وضعیت شغل به 'در حال بررسی' تغییر یافت و منتظر بررسی مجدد ادمین می‌باشد.");
        } else {
          alert("دسته‌بندی شغل با موفقیت بروزرسانی شد.");
        }
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

  const isOwner = session?.user && (
    ((session.user as any).id && String((session.user as any).id) === String(job.userId)) ||
    (session.user.mobile && job.user?.mobile && session.user.mobile === job.user.mobile) ||
    (session.user.role === "ADMIN")
  );

  if (!session || !isOwner) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">عدم دسترسی</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full lg:w-[95%] mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <a href="/" className="hover:text-primary">خانه</a>
          <ChevronLeft size={12} />
          <a href="/profile" className="hover:text-primary">پروفایل کاربری</a>
          <ChevronLeft size={12} />
          <span className="text-gray-700">
            {isFullEditAllowed ? "ویرایش و اصلاح کامل شغل" : "ویرایش گروه و دسته شغلی"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload Section (Left in RTL means order-2) */}
          <div className="lg:col-span-1 order-2 lg:order-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">تصاویر شغل</h3>

              {/* Main Image Preview */}
              <div className="aspect-square bg-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                {images.length > 0 ? (
                  <img src={images[mainImageIndex]?.url} alt="تصویر اصلی" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImagePlus size={40} className="mx-auto mb-2" />
                    <p className="text-xs">تصویر اصلی در اینجا نمایش داده می‌شود</p>
                  </div>
                )}
                {/* Nav Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMainImageIndex(Math.max(0, mainImageIndex - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow flex items-center justify-center"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMainImageIndex(Math.min(images.length - 1, mainImageIndex + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow flex items-center justify-center rotate-180"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails & Upload */}
              <div className="flex items-center gap-2 mb-4">
                {isFullEditAllowed && images.length < maxImages && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary flex items-center justify-center cursor-pointer transition-colors shrink-0">
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    <Upload size={18} className="text-gray-400" />
                  </label>
                )}

                {images.map((img, i) => (
                  <div key={i} className="relative group shrink-0">
                    <button
                      type="button"
                      onClick={() => setMainImageIndex(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === mainImageIndex ? "border-red-500 shadow-md" : "border-gray-200"
                        }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                    {isFullEditAllowed && (
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    )}
                    {i === mainImageIndex && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-red-500 text-white px-1 rounded">
                        اصلی
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400">
                {isFullEditAllowed
                  ? `حداکثر ${maxImages} تصویر. کلیک بر روی هر تصویر، آن را به عنوان تصویر اصلی تنظیم می‌کند.`
                  : "برای ویرایش تصاویر، آگهی باید در وضعیت نیاز به اصلاح باشد."}
              </p>
            </div>
          </div>

          {/* Form Section (Right in RTL means order-1) */}
          <div className="lg:col-span-1 order-1 lg:order-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-black text-gray-800 mb-4">
                {isFullEditAllowed ? "ویرایش و اصلاح اطلاعات شغل" : "ویرایش گروه و دسته شغلی"}
              </h2>

              {job.adminNote && isFullEditAllowed && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-5">
                  <h4 className="font-bold text-amber-900 text-sm mb-1">⚠️ پیام ادمین (دلیل نیاز به اصلاح):</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {job.adminNote.replace('[NEEDS_EDIT] ', '')}
                  </p>
                </div>
              )}

              {!isFullEditAllowed && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    شما می‌توانید گروه و دسته‌بندی شغلی خود را ویرایش کنید. این تغییرات نیاز به تایید مجدد ادمین ندارند و فوراً اعمال می‌شوند.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {/* Category & Subcategory */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">گروه شغلی *</label>
                  <select
                    value={selectedCategoryIndex ?? ""}
                    onChange={(e) => {
                      setSelectedCategoryIndex(e.target.value ? parseInt(e.target.value) : null);
                      setSelectedSubCategorySlug("");
                    }}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">انتخاب کنید...</option>
                    {jobCategories.map((cat, index) => (
                      <option key={cat.id} value={index}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">دسته شغلی *</label>
                  <select
                    value={selectedSubCategorySlug}
                    onChange={(e) => setSelectedSubCategorySlug(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    disabled={selectedCategoryIndex === null}
                  >
                    <option value="">
                      {selectedCategoryIndex !== null ? "انتخاب دسته شغلی..." : "ابتدا گروه شغلی را انتخاب کنید..."}
                    </option>
                    {selectedCategory?.subCategories.map((sub) => (
                      <option key={sub.id} value={sub.slug}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additional Fields - Only Shown for NEEDS_EDIT / REJECTED */}
                {isFullEditAllowed && (
                  <>
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">عنوان شغل *</label>
                      <input
                        type="text"
                        value={formData.title}
                        maxLength={100}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="عنوان شغل"
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">توضیحات کوتاه *</label>
                      <textarea
                        value={formData.description}
                        maxLength={800}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="معرفی خدمات و شرح کسب و کار..."
                        className="w-full h-24 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                      />
                    </div>

                    {/* Phone Numbers */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                          شماره‌های تماس (حداکثر ۳ شماره) *
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
                                updated[idx].number = e.target.value.replace(/[^0-9\s-]/g, "");
                                setPhoneList(updated);
                              }}
                              placeholder={idx === 0 ? "مثلاً: 412345678 یا 0412345678" : "شماره تماس دیگر..."}
                              className="flex-1 px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr font-mono"
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
                              <option value="+61">🇦🇺 استرالیا (+61)</option>
                            </select>

                            {/* Remove Button */}
                            {phoneList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setPhoneList(phoneList.filter((_, i) => i !== idx))}
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                                title="حذف این شماره"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        شماره اول الزامی است. می‌توانید حداکثر تا ۳ شماره تماس با پیش‌شماره کشور ثبت نمایید.
                      </p>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">آدرس پستی</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="آدرس دقیق محل کسب"
                        className="w-full h-16 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">آدرس ایمیل</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="example@domain.com"
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">وب‌سایت</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">واتساپ</label>
                      <input
                        type="text"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange("whatsapp", e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="61414652687"
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr"
                      />
                    </div>

                    {/* Telegram */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">تلگرام</label>
                      <input
                        type="text"
                        value={formData.telegram}
                        onChange={(e) => handleInputChange("telegram", e.target.value)}
                        placeholder="نام کاربری تلگرام"
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr"
                      />
                    </div>

                    {/* Instagram */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">اینستاگرام</label>
                      <input
                        type="text"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange("instagram", e.target.value)}
                        placeholder="نام کاربری اینستاگرام"
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr"
                      />
                    </div>

                    {/* Work Hours */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">ساعات کاری</label>
                      <input
                        type="text"
                        value={formData.workHours}
                        onChange={(e) => handleInputChange("workHours", e.target.value)}
                        placeholder="مثلاً همه‌روزه ۹ صبح تا ۵ عصر"
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/profile")}
                    className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      "در حال ذخیره..."
                    ) : (
                      <>
                        <Save size={18} />
                        {isFullEditAllowed ? "ثبت و ارسال اصلاحات" : "ذخیره تغییرات دسته‌بندی"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
