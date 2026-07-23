"use client";

import { useState, useEffect } from "react";
import { Save, Globe, CreditCard, Bell, Shield, Palette, Clock, Mail } from "lucide-react";

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState("general");

  // General settings
  const [siteName, setSiteName] = useState("مشاغل ایرانیان استرالیا");
  const [siteNameEn, setSiteNameEn] = useState("AUIR");
  const [siteDescription, setSiteDescription] = useState("پل ارتباطی مؤثر میان ایرانیان مقیم استرالیا و کسب‌وکارهای ایرانی");
  const [contactEmail, setContactEmail] = useState("info@auir.com.au");
  const [contactPhone, setContactPhone] = useState("+61 000 000 000");

  // Pricing
  const [price6Month, setPrice6Month] = useState("25");
  const [price12Month, setPrice12Month] = useState("45");
  const [priceVip, setPriceVip] = useState("15");
  const [priceBoost1, setPriceBoost1] = useState("5");
  const [priceBoost3, setPriceBoost3] = useState("12");
  const [priceBoost7, setPriceBoost7] = useState("20");
  const [priceCommercialAd, setPriceCommercialAd] = useState("15");

  // Notifications
  const [emailNotify, setEmailNotify] = useState(true);
  const [smsNotify, setSmsNotify] = useState(false);
  const [adminNotifyNewJob, setAdminNotifyNewJob] = useState(true);
  const [adminNotifyNewPayment, setAdminNotifyNewPayment] = useState(true);
  const [userNotifyApproval, setUserNotifyApproval] = useState(true);

  // Rules
  const [maxImages, setMaxImages] = useState("3");
  const [maxImageSize, setMaxImageSize] = useState("300");
  const [maxTitleLength, setMaxTitleLength] = useState("100");
  const [maxDescLength, setMaxDescLength] = useState("500");
  const [freeAdLimit, setFreeAdLimit] = useState("3");
  const [commercialAdDuration, setCommercialAdDuration] = useState("10");
  const [commercialFreeAdDuration, setCommercialFreeAdDuration] = useState("10");
  const [employmentAdDuration, setEmploymentAdDuration] = useState("10");
  const [jobSeekerAdDuration, setJobSeekerAdDuration] = useState("10");
  const [sessionDuration, setSessionDuration] = useState("30");
  const [jobExpirationDuration, setJobExpirationDuration] = useState("30");
  const [expirationWarningDays, setExpirationWarningDays] = useState("7");
  const [reviewsEnabled, setReviewsEnabled] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.siteName) setSiteName(data.siteName);
        if (data.siteNameEn) setSiteNameEn(data.siteNameEn);
        if (data.siteDescription) setSiteDescription(data.siteDescription);
        if (data.contactEmail) setContactEmail(data.contactEmail);
        if (data.contactPhone) setContactPhone(data.contactPhone);
        if (data.price6Month) setPrice6Month(data.price6Month);
        if (data.price12Month) setPrice12Month(data.price12Month);
        if (data.priceVip) setPriceVip(data.priceVip);
        if (data.priceBoost1) setPriceBoost1(data.priceBoost1);
        if (data.priceBoost3) setPriceBoost3(data.priceBoost3);
        if (data.priceBoost7) setPriceBoost7(data.priceBoost7);
        if (data.priceCommercialAd) setPriceCommercialAd(data.priceCommercialAd);
        if (data.emailNotify) setEmailNotify(data.emailNotify === "true");
        if (data.smsNotify) setSmsNotify(data.smsNotify === "true");
        if (data.adminNotifyNewJob) setAdminNotifyNewJob(data.adminNotifyNewJob === "true");
        if (data.adminNotifyNewPayment) setAdminNotifyNewPayment(data.adminNotifyNewPayment === "true");
        if (data.userNotifyApproval) setUserNotifyApproval(data.userNotifyApproval === "true");
        if (data.maxImages) setMaxImages(data.maxImages);
        if (data.maxImageSize) setMaxImageSize(data.maxImageSize);
        if (data.maxTitleLength) setMaxTitleLength(data.maxTitleLength);
        if (data.maxDescLength) setMaxDescLength(data.maxDescLength);
        if (data.freeAdLimit) setFreeAdLimit(data.freeAdLimit);
        if (data.commercialAdDuration) setCommercialAdDuration(data.commercialAdDuration);
        if (data.commercialFreeAdDuration) setCommercialFreeAdDuration(data.commercialFreeAdDuration);
        if (data.employmentAdDuration) setEmploymentAdDuration(data.employmentAdDuration);
        if (data.jobSeekerAdDuration) setJobSeekerAdDuration(data.jobSeekerAdDuration);
        if (data.sessionDuration) setSessionDuration(data.sessionDuration);
        if (data.jobExpirationDuration) setJobExpirationDuration(data.jobExpirationDuration);
        if (data.expirationWarningDays) setExpirationWarningDays(data.expirationWarningDays);
        if (data.reviews_enabled) setReviewsEnabled(data.reviews_enabled === "true");
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings", err);
        setIsLoading(false);
      });
  }, []);

  const sections = [
    { key: "general", label: "عمومی", icon: <Globe size={18} /> },
    { key: "pricing", label: "قیمت‌گذاری", icon: <CreditCard size={18} /> },
    { key: "notifications", label: "اطلاع‌رسانی", icon: <Bell size={18} /> },
    { key: "rules", label: "قوانین ثبت", icon: <Shield size={18} /> },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        siteName, siteNameEn, siteDescription, contactEmail, contactPhone,
        price6Month, price12Month, priceVip, priceBoost1, priceBoost3, priceBoost7, priceCommercialAd,
        emailNotify: String(emailNotify), smsNotify: String(smsNotify),
        adminNotifyNewJob: String(adminNotifyNewJob), adminNotifyNewPayment: String(adminNotifyNewPayment),
        userNotifyApproval: String(userNotifyApproval),
        maxImages, maxImageSize, maxTitleLength, maxDescLength, freeAdLimit, commercialAdDuration,
        commercialFreeAdDuration, employmentAdDuration, jobSeekerAdDuration,
        sessionDuration, jobExpirationDuration, expirationWarningDays,
        reviews_enabled: String(reviewsEnabled)
      };
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        // Removed success alert
      } else {
        alert("خطا در ذخیره تنظیمات");
      }
    } catch (err) {
      console.error(err);
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">تنظیمات</h1>
        <button onClick={handleSave} disabled={isSaving || isLoading}
          className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md disabled:opacity-50">
          <Save size={16} />
          {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">در حال بارگذاری...</div>
      ) : (

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-1">
              {sections.map((s) => (
                <button key={s.key} onClick={() => setActiveSection(s.key)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === s.key
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                    }`}>
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-fade-in">
              {/* General */}
              {activeSection === "general" && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Globe size={20} className="text-primary" />
                    تنظیمات عمومی سایت
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">نام سایت (فارسی)</label>
                      <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">نام سایت (انگلیسی)</label>
                      <input type="text" value={siteNameEn} onChange={(e) => setSiteNameEn(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">توضیحات سایت (SEO)</label>
                    <textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)}
                      className="w-full h-20 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">ایمیل تماس</label>
                      <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">تلفن تماس</label>
                      <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr" />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              {activeSection === "pricing" && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard size={20} className="text-green-600" />
                    تنظیمات قیمت‌گذاری (AUD)
                  </h3>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-green-800 mb-3">اشتراک مشاغل</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">اشتراک ۶ ماهه ($)</label>
                        <input type="number" value={price6Month} onChange={(e) => setPrice6Month(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">اشتراک ۱۲ ماهه ($)</label>
                        <input type="number" value={price12Month} onChange={(e) => setPrice12Month(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 text-left dir-ltr" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-amber-800 mb-3">اشتراک ویژه و بوست</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">ویژه ($)</label>
                        <input type="number" value={priceVip} onChange={(e) => setPriceVip(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">بوست ۱ روزه ($)</label>
                        <input type="number" value={priceBoost1} onChange={(e) => setPriceBoost1(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">بوست ۳ روزه ($)</label>
                        <input type="number" value={priceBoost3} onChange={(e) => setPriceBoost3(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">بوست ۷ روزه ($)</label>
                        <input type="number" value={priceBoost7} onChange={(e) => setPriceBoost7(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-blue-800 mb-3">آگهی تجاری</h4>
                    <div className="max-w-xs">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">هزینه آگهی تجاری ($)</label>
                      <input type="number" value={priceCommercialAd} onChange={(e) => setPriceCommercialAd(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeSection === "notifications" && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Bell size={20} className="text-amber-500" />
                    تنظیمات اطلاع‌رسانی
                  </h3>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">کانال‌های ارسال</h4>
                    {[
                      { label: "ارسال ایمیل", desc: "ارسال اطلاع‌رسانی از طریق ایمیل", checked: emailNotify, onChange: setEmailNotify },
                      { label: "ارسال پیامک", desc: "ارسال OTP و اطلاع‌رسانی از طریق SMS", checked: smsNotify, onChange: setSmsNotify },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.label}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => item.onChange(!item.checked)}
                          className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${item.checked ? "bg-primary" : "bg-gray-300"}`}
                        >
                          <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${item.checked ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">اطلاع‌رسانی به ادمین</h4>
                    {[
                      { label: "ثبت شغل جدید", checked: adminNotifyNewJob, onChange: setAdminNotifyNewJob },
                      { label: "پرداخت جدید", checked: adminNotifyNewPayment, onChange: setAdminNotifyNewPayment },
                    ].map((item, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <input type="checkbox" checked={item.checked} onChange={(e) => item.onChange(e.target.checked)}
                          className="w-4 h-4 accent-primary" />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">اطلاع‌رسانی به کاربر</h4>
                    {[
                      { label: "تأیید یا رد شغل/آگهی", checked: userNotifyApproval, onChange: setUserNotifyApproval },
                    ].map((item, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <input type="checkbox" checked={item.checked} onChange={(e) => item.onChange(e.target.checked)}
                          className="w-4 h-4 accent-primary" />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {activeSection === "rules" && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Shield size={20} className="text-purple-600" />
                    قوانین ثبت مشاغل و آگهی‌ها
                  </h3>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-purple-800 mb-3">محدودیت تصاویر</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">حداکثر تعداد تصاویر</label>
                        <input type="number" value={maxImages} onChange={(e) => setMaxImages(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">حداکثر حجم تصویر (KB)</label>
                        <input type="number" value={maxImageSize} onChange={(e) => setMaxImageSize(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-indigo-800 mb-3">محدودیت متنی</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">حداکثر طول عنوان (کاراکتر)</label>
                        <input type="number" value={maxTitleLength} onChange={(e) => setMaxTitleLength(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">حداکثر طول توضیحات (کاراکتر)</label>
                        <input type="number" value={maxDescLength} onChange={(e) => setMaxDescLength(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-teal-800 mb-3">آگهی‌های رایگان</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">حداکثر تعداد آگهی رایگان هر کاربر (۰ = نامحدود)</label>
                        <input type="number" value={freeAdLimit} onChange={(e) => setFreeAdLimit(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                        <p className="text-[11px] text-teal-700 mt-1">در صورت عبور از این سقف، کاربر تنها مجاز به ثبت آگهی تجاری (پولی) خواهد بود.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                    <h4 className="text-sm font-bold text-amber-800 mb-3">مدت نمایش انواع آگهی</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">آگهی تجاری پولی (روز)</label>
                        <input type="number" value={commercialAdDuration} onChange={(e) => setCommercialAdDuration(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">آگهی تجاری رایگان (روز)</label>
                        <input type="number" value={commercialFreeAdDuration} onChange={(e) => setCommercialFreeAdDuration(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">آگهی استخدام (روز)</label>
                        <input type="number" value={employmentAdDuration} onChange={(e) => setEmploymentAdDuration(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">آگهی جویای کار (روز)</label>
                        <input type="number" value={jobSeekerAdDuration} onChange={(e) => setJobSeekerAdDuration(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-3">سایر تنظیمات زمانی</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">مدت زمان نشست کاربر (روز)</label>
                        <input type="number" value={sessionDuration} onChange={(e) => setSessionDuration(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">مدت زمان اعتبار مشاغل (روز)</label>
                        <input type="number" value={jobExpirationDuration} onChange={(e) => setJobExpirationDuration(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">زمان هشدار انقضا (روز)</label>
                        <input type="number" value={expirationWarningDays} onChange={(e) => setExpirationWarningDays(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-left dir-ltr" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mt-4">
                    <h4 className="text-sm font-bold text-rose-800 mb-3">دیدگاه‌ها</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">فعال‌سازی بخش ثبت نظر</h4>
                        <p className="text-xs text-gray-500 mt-0.5">در صورت غیرفعال بودن، کاربران فقط می‌توانند امتیاز (ستاره) ثبت کنند و نظرات متنی پنهان می‌شود.</p>
                      </div>
                      <button
                        onClick={() => setReviewsEnabled(!reviewsEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${reviewsEnabled ? "bg-green-500" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${reviewsEnabled ? "translate-x-6" : "translate-x-0"}`} />
                      </button>
                    </div>
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
