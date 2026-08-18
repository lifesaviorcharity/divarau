"use client";

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useCityStore } from "@/store/cityStore";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  ChevronLeft,
  AlertTriangle,
  ImagePlus,
  Check,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  BadgeCheck,
  BookOpen,
  Plus,
} from "lucide-react";

import { compressImage } from "@/lib/compressImage";
import { limitDigits } from "@/lib/utils";

export default function RegisterJobPage() {
  const { selectedCity, openCityModal } = useCityStore();
  const { categories: jobCategories, isLoading: isCategoriesLoading } = useCategories();
  const { data: session } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState("");
  const [formData, setFormData] = useState({
    title: "", description: "", address: "", email: "",
    website: "", whatsapp: "", telegram: "", instagram: "", workHours: "",
  });
  const [phoneList, setPhoneList] = useState<{ countryCode: string; number: string }[]>([
    { countryCode: "+61", number: "" },
  ]);
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [subscriptionType, setSubscriptionType] = useState<"6" | "12">("6");
  const [isVip, setIsVip] = useState(false);
  const [isBoosted, setIsBoosted] = useState(false);
  const [boostPeriod, setBoostPeriod] = useState<"1" | "3" | "7">("1");
  const [pricingSettings, setPricingSettings] = useState<any>({});
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setPricingSettings(data))
      .catch((err) => console.error("Failed to load settings", err));
  }, []);

  const selectedCategory = selectedCategoryIndex !== null ? jobCategories[selectedCategoryIndex] : null;

  const maxImages = parseInt(pricingSettings.maxImages || "3", 10);
  const maxImageSizeKB = parseInt(pricingSettings.maxImageSize || "300", 10);

  const price6 = parseFloat(pricingSettings.price6Month) || 25;
  const price12 = parseFloat(pricingSettings.price12Month) || 45;
  const priceVip = parseFloat(pricingSettings.priceVip) || 15;
  const priceB1 = parseFloat(pricingSettings.priceBoost1) || 5;
  const priceB3 = parseFloat(pricingSettings.priceBoost3) || 12;
  const priceB7 = parseFloat(pricingSettings.priceBoost7) || 20;

  const currentBoostPrice = boostPeriod === "1" ? priceB1 : boostPeriod === "3" ? priceB3 : priceB7;
  const extraCost = (isVip ? priceVip : 0) + (isBoosted ? currentBoostPrice : 0);

  const total6 = price6 + extraCost;
  const total12 = price12 + extraCost;
  const finalPrice = subscriptionType === "6" ? total6 : total12;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > maxImages) {
      alert(`حداکثر ${maxImages} تصویر مجاز است`);
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

      const url = URL.createObjectURL(finalFile);
      setImages((prev) => [...prev, { url, file: finalFile }]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (mainImageIndex === index) setMainImageIndex(0);
    else if (mainImageIndex > index) setMainImageIndex(mainImageIndex - 1);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedCity || !selectedCity.id || selectedCity.id === 0) { openCityModal(); return; }
    if (!isLoggedIn) return;

    const formattedPhones = phoneList
      .map((p) => (p.number.trim() ? `${p.countryCode} ${p.number.trim()}` : ""))
      .filter(Boolean)
      .join(", ");

    if (
      selectedCategoryIndex === null ||
      !selectedSubCategorySlug ||
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formattedPhones
    ) {
      alert("لطفاً تمامی فیلدهای ستاره‌دار (اجباری) از جمله حداقل یک شماره تماس را پر کنید.");
      return;
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert("فرمت ایمیل وارد شده نامعتبر است. لطفا ایمیل صحیح وارد کنید.");
        return;
      }
    }

    if (!isConfirmed) {
      alert("لطفا تاییدیه صحت اطلاعات را علامت بزنید.");
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

      // Convert image files to base64 for server-side file storage
      const imagePayloads = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(img.file);
        });
        imagePayloads.push({
          url: base64,
          isMain: i === mainImageIndex,
        });
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          phone: formattedPhones,
          address: formData.address,
          email: formData.email,
          website: formData.website,
          whatsapp: formData.whatsapp,
          telegram: formData.telegram,
          instagram: formData.instagram,
          workingHours: formData.workHours,
          cityId: selectedCity.id,
          categoryId: realCategoryId,
          subCategoryId: realSubCategoryId,
          subscriptionType: subscriptionType === "6" ? "SIX_MONTHS" : "TWELVE_MONTHS",
          isVip,
          isBoosted,
          boostPeriod: isBoosted
            ? boostPeriod === "7"
              ? "SEVEN_DAYS"
              : boostPeriod === "3"
              ? "THREE_DAYS"
              : "ONE_DAY"
            : null,
          images: imagePayloads,
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("شغل شما با موفقیت ثبت شد و در حال بررسی می‌باشد.");
        router.push("/profile");
      } else {
        alert(data.error || "خطایی رخ داد.");
      }
    } catch (e) {
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full lg:w-[95%] mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <a href="/" className="hover:text-primary">خانه</a>
          <ChevronLeft size={12} />
          <span className="text-gray-700">ثبت شغل جدید</span>
        </div>

        {/* Auth Warning */}
        {!isLoggedIn && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-fade-in">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">
                لطفاً قبل از ثبت شغل با حساب کاربری خود وارد شوید و در صورتی که
                حساب کاربری ندارید نسبت به ثبت حساب خود اقدام نمایید.
              </p>
              <div className="flex gap-2 mt-2">
                <a href="/auth/login" className="text-xs text-primary font-semibold hover:underline">ورود</a>
                <span className="text-gray-300">|</span>
                <a href="/auth/login" className="text-xs text-primary font-semibold hover:underline">ثبت‌نام</a>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload Section (Left in RTL means order-2) */}
          <div className="lg:col-span-1 order-2 lg:order-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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
                    <button onClick={() => setMainImageIndex(Math.max(0, mainImageIndex - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow flex items-center justify-center">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setMainImageIndex(Math.min(images.length - 1, mainImageIndex + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow flex items-center justify-center rotate-180">
                      <ChevronLeft size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex items-center gap-2 mb-2">
                {/* Upload Button */}
                {images.length < maxImages && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary flex items-center justify-center cursor-pointer transition-colors">
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    <Upload size={18} className="text-gray-400" />
                  </label>
                )}

                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <button
                      onClick={() => setMainImageIndex(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === mainImageIndex ? "border-red-500 shadow-md" : "border-gray-200"
                        }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                    <button onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                    {i === mainImageIndex && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-red-500 text-white px-1 rounded">اصلی</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mb-6">
                حداکثر {maxImages} تصویر (حداکثر {maxImageSizeKB}KB). کلیک بر روی هر تصویر، آن را به عنوان تصویر اصلی تنظیم می‌کند.
              </p>

              {/* Subscription Section */}
              <div className="mt-6 border-t border-gray-100 pt-5">
                <h4 className="text-sm font-bold text-green-700 mb-3">انتخاب نوع اشتراک</h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button onClick={() => setSubscriptionType("6")}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${subscriptionType === "6" ? "border-green-500 bg-green-50" : "border-gray-200"
                      }`}>
                    <p className="text-sm font-bold text-gray-800">اشتراک ۶ ماهه</p>
                    <p className="text-[10px] text-gray-500 mt-1">مدت زمان: ۱۸۰ روز</p>
                    <p className="text-xs text-green-600 font-bold mt-1 flex justify-center gap-1" dir="rtl">
                      <span>هزینه:</span>
                      <span dir="ltr">${price6}</span>
                    </p>
                  </button>
                  <button onClick={() => setSubscriptionType("12")}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${subscriptionType === "12" ? "border-green-500 bg-green-50" : "border-gray-200"
                      }`}>
                    <p className="text-sm font-bold text-gray-800">اشتراک ۱۲ ماهه</p>
                    <p className="text-[10px] text-gray-500 mt-1">مدت زمان: ۳۶۵ روز</p>
                    <p className="text-xs text-green-600 font-bold mt-1 flex justify-center gap-1" dir="rtl">
                      <span>هزینه:</span>
                      <span dir="ltr">${price12}</span>
                    </p>
                  </button>
                </div>

                {/* VIP */}
                <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-green-300 cursor-pointer mb-1">
                  <input type="checkbox" checked={isVip} onChange={(e) => setIsVip(e.target.checked)}
                    className="w-4 h-4 accent-green-600" />
                  <span className="text-xs font-medium text-gray-700">فعال‌سازی اشتراک ویژه (${priceVip})</span>
                </label>
                <p className="text-[10px] text-gray-500 mr-6 mb-4">
                  🌟 اشتراک ویژه به شما این امکان را می‌دهد که مشاغل شما علاوه بر زیرگروه مرتبط خود در گروه اصلی مشاغل نیز قابل مشاهده باشند.
                </p>

                {/* Boost */}
                <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-green-300 cursor-pointer mb-1">
                  <input type="checkbox" checked={isBoosted} onChange={(e) => setIsBoosted(e.target.checked)}
                    className="w-4 h-4 accent-green-600" />
                  <span className="text-xs font-medium text-gray-700">فعال‌سازی پله شدن آگهی</span>
                </label>
                <p className="text-[10px] text-gray-500 mr-6 mb-2">
                  🌟 پله شدن به شما این امکان را می دهد که آگهی شغل شما در بازه زمانی تعیین شده، در صدر مشاغل هم گروه خود نمایش داده شود
                </p>
                {isBoosted && (
                  <div className="flex gap-2 mt-2 mr-6">
                    {[
                      { v: "1", l: `۱ روزه ($${priceB1})` },
                      { v: "3", l: `۳ روزه ($${priceB3})` },
                      { v: "7", l: `۷ روزه ($${priceB7})` }
                    ].map((p) => (
                      <button key={p.v} onClick={() => setBoostPeriod(p.v as "1" | "3" | "7")}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${boostPeriod === p.v ? "border-green-500 bg-green-50 text-green-700 font-bold" : "border-gray-200 text-gray-600"
                          }`}>
                        {p.l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Section (Right in RTL means order-1) */}
          <div className="lg:col-span-1 order-1 lg:order-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-black text-primary mb-6">فرم تعریف شغل جدید</h2>

              <div className="space-y-5">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">گروه شغلی *</label>
                  <select value={selectedCategoryIndex ?? ""}
                    onChange={(e) => { setSelectedCategoryIndex(e.target.value ? parseInt(e.target.value) : null); setSelectedSubCategorySlug(""); }}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="">انتخاب کنید...</option>
                    {jobCategories.map((cat, i) => (
                      <option key={i} value={i}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* SubCategory */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">دسته شغلی *</label>
                  <select value={selectedSubCategorySlug}
                    onChange={(e) => setSelectedSubCategorySlug(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    disabled={!selectedCategory}>
                    <option value="">{selectedCategory ? "انتخاب دسته شغلی..." : "ابتدا گروه شغلی را انتخاب کنید..."}</option>
                    {selectedCategory?.subCategories.map((sub) => (
                      <option key={sub.slug} value={sub.slug}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">عنوان شغل *</label>
                  <input type="text" value={formData.title} maxLength={100}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="مثلاً: کلینیک دندانپزشکی پارس"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <p className="text-[10px] text-gray-400 mt-1">{formData.title.length}/100 کاراکتر</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">توضیحات کوتاه *</label>
                  <textarea value={formData.description} maxLength={800}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="چکیده‌ای از خدمات و معرفی کسب و کار بنویسید..."
                    className="w-full h-24 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                  <p className="text-[10px] text-gray-400 mt-1">{formData.description.length}/800 کاراکتر</p>
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
                      <div key={idx} className="flex items-center gap-1">

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
                          <option value="+61">AU (+61)</option>
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
                  <textarea value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="آدرس دقیق محل کسب"
                    className="w-full h-16 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">آدرس ایمیل</label>
                  <input type="email" value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="example@domain.com"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr" />
                  <p className="text-[10px] text-gray-400 mt-1">در صورت ورود، فرمت صحیح ایمیل بررسی می‌شود.</p>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">وب‌سایت</label>
                  <input type="url" value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr" />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">واتساپ</label>
                  <input type="text" value={formData.whatsapp}
                    onChange={(e) => handleInputChange("whatsapp", limitDigits(e.target.value, 14))}
                    maxLength={14}
                    placeholder='شماره موبایل واتساپ خود را به صورت "61414652687" وارد نمایید'
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr font-mono" />
                </div>

                {/* Telegram */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">تلگرام</label>
                  <input type="text" value={formData.telegram}
                    onChange={(e) => handleInputChange("telegram", e.target.value)}
                    placeholder="نام کاربری تلگرام خود را وارد کنید، به عنوان مثال Elizabeth"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr" />
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">اینستاگرام</label>
                  <input type="text" value={formData.instagram}
                    onChange={(e) => handleInputChange("instagram", e.target.value)}
                    placeholder="نام کاربری اینستاگرام خود را وارد کنید، به عنوان مثال Elizabeth"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr" />
                </div>

                {/* Work Hours */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ساعات کاری</label>
                  <input type="text" value={formData.workHours}
                    onChange={(e) => handleInputChange("workHours", e.target.value)}
                    placeholder="مثلاً همه‌روزه ۹ صبح تا ۵ عصر"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>

                {/* Final Price Summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between mt-6">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">مجموع فاکتور شما</h4>
                    <p className="text-xs text-gray-500 mt-1">شامل هزینه اشتراک و خدمات ویژه</p>
                  </div>
                  <div className="text-left" dir="ltr">
                    <span className="text-2xl font-black text-primary">${finalPrice}</span>
                  </div>
                </div>

                {/* Registration Guide Link (Prominent) */}
                <div className="mt-6 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5 text-blue-950 font-bold text-xs">
                    <BookOpen size={20} className="text-blue-600 shrink-0" />
                    <span>پیش از ثبت، قوانین و مراحل را مطالعه نمایید:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGuideModalOpen(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all shadow hover:shadow-md cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span>راهنمای ثبت شغل</span>
                  </button>
                </div>

                {/* Confirmation Checkbox */}
                <div className="mt-4 mb-2 flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="confirmInfo"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-primary cursor-pointer shrink-0"
                  />
                  <label htmlFor="confirmInfo" className="text-xs font-medium text-gray-700 cursor-pointer select-none leading-5">
                    آیا از صحت اطلاعات واردشده و تصویر انتخاب‌شده به عنوان تصویر اصلی اطمینان دارید؟
                  </label>
                </div>

                {/* Submit */}
                <button onClick={handleSubmit} disabled={!isLoggedIn || isSubmitting || !isConfirmed}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${isLoggedIn && !isSubmitting && isConfirmed
                    ? "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}>
                  {isSubmitting ? "در حال ثبت..." : "ثبت شغل"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Guide Modal */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col dir-rtl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2.5 text-gray-800">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <BookOpen size={18} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">راهنمای ثبت شغل</h3>
              </div>
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-gray-700">
              <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-4 text-blue-900">
                <p className="font-bold text-blue-950 mb-2">
                  لطفا پیش از ثبت شغل، موارد زیر را با دقت مطالعه نمایید:
                </p>
                <p className="text-xs leading-6 text-blue-900/90">
                  پس از ثبت شغل، اطلاعات ثبت‌شده شما جهت بررسی در اختیار ادمین سایت قرار می‌گیرد، بنابراین بعد از ثبت، وضعیت شغل به &quot;در حال بررسی&quot; تغییر می‌یابد.و تا زمان تایید نهایی، امکان ویرایش اطلاعات ثبت‌شده توسط شما وجود نخواهد داشت.پس از بررسی، درخواست ثبت‌شده ممکن است در یکی از وضعیت‌های زیر قرار گیرد:
                </p>
              </div>

              {/* Status List */}
              <div className="space-y-3.5">
                {/* 1. تایید اولیه */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                    <span className="font-bold text-blue-900">تایید اولیه</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-6">
                    در صورتی که اطلاعات ثبت‌شده مطابق قوانین سایت باشد، توسط ادمین تأیید اولیه می‌شود. پس از تأیید اولیه، اطلاعات شغل شما در دسته‌بندی مربوطه در سایت قابل نمایش خواهد بود، اما اطلاعات تماس و تصاویر ثبت‌شده تا زمان انجام پرداخت قابل مشاهده نخواهند بود.
                  </p>
                </div>

                {/* 2. نیاز به اصلاح */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={18} className="text-amber-600 shrink-0" />
                    <span className="font-bold text-amber-900">نیاز به اصلاح</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-6">
                    چنانچه ادمین تشخیص دهد که اطلاعات ثبت‌شده برای قابل نمایش شدن نیاز به اصلاح دارد، وضعیت شغل به &quot;نیاز به اصلاح&quot; تغییر می‌یابد. در این حالت، ادمین توضیحات لازم درباره مواردی که باید اصلاح شوند را برای شما ثبت می‌کند. شما می‌توانید با مراجعه به دیوار من بخش پیام‌ها، توضیحات ادمین را مشاهده کرده و پس از اعمال اصلاحات، اطلاعات را مجددا ارسال نمایید. پس از ثبت اصلاحات، وضعیت شغل دوباره به &quot;در حال بررسی&quot; تغییر کرده و منتظر بررسی و تأیید مجدد ادمین خواهد بود.
                  </p>
                </div>

                {/* 3. رد شدن اطلاعات */}
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/30">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle size={18} className="text-red-600 shrink-0" />
                    <span className="font-bold text-red-900">رد شدن اطلاعات</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-6">
                    در صورتی که اطلاعات ثبت‌شده مورد تأیید ادمین نباشد، وضعیت شغل به &quot;رد شده&quot; تغییر می‌کند. در این حالت، دلیل رد شدن اطلاعات توسط ادمین در قالب پیام برای شما ثبت می‌شود. شما می‌توانید با مراجعه به دیوار من بخش پیام‌ها و یا زیر شغل مربوطه در لیست مشاغل، دلیل رد شدن اطلاعات را مشاهده نمایید.
                  </p>
                </div>

                {/* 4. حذف اطلاعات */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 size={18} className="text-gray-600 shrink-0" />
                    <span className="font-bold text-gray-900">حذف اطلاعات</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-6">
                    در صورتی که اطلاعات ثبت‌شده مغایر قوانین و مقررات سایت باشد، ادمین می‌تواند نسبت به حذف آن اقدام نماید.
                  </p>
                </div>

                {/* 5. تأیید نهایی */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
                  <div className="flex items-center gap-2 mb-2">
                    <BadgeCheck size={18} className="text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-900">تأیید نهایی</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-6">
                    پس از تأیید اولیه، لازم است هزینه اشتراک انتخابی را از طریق درگاه پرداخت سایت انجام دهید. پس از انجام موفق پرداخت، شغل شما به‌صورت خودکار تأیید نهایی شده و تمامی اطلاعات شغل ثبت‌شده شما، به‌طور کامل در سایت قابل نمایش و جستجو خواهد بود.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/80 flex justify-end">
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
