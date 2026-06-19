"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  MessageSquare,
  LifeBuoy,
  User,
  LogOut,
  ChevronLeft,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Settings,
  Save
} from "lucide-react";
import { toJalali } from "@/lib/utils";

type Tab = "jobs" | "ads" | "messages" | "tickets" | "settings";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("jobs");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Settings Form State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { update } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetch("/api/profile")
        .then(res => res.json())
        .then(data => {
          setProfileData(data);
          setUsername(data.username || "");
          setEmail(data.email || "");
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const tabs = [
    { key: "jobs" as Tab, label: "مشاغل من", icon: <Briefcase size={18} /> },
    { key: "ads" as Tab, label: "آگهی‌های من", icon: <FileText size={18} /> },
    { key: "messages" as Tab, label: "پیام‌ها", icon: <MessageSquare size={18} />, badge: profileData?.messages?.length || 0 },
    { key: "tickets" as Tab, label: "تیکت پشتیبانی", icon: <LifeBuoy size={18} /> },
    { key: "settings" as Tab, label: "تنظیمات حساب", icon: <Settings size={18} /> },
  ];

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email })
      });
      const data = await res.json();
      if (res.ok) {
        // Update NextAuth session so UI catches the new name
        await update({ name: username || session?.user?.mobile });
        alert("اطلاعات پروفایل با موفقیت بروزرسانی شد.");
      } else {
        setSaveError(data.error || "خطا در بروزرسانی پروفایل");
      }
    } catch (err) {
      setSaveError("خطا در ارتباط با سرور");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteJob = async (jobId: number, status: string) => {
    const isPaid = status === "FINAL" || status === "PAID";
    const msg = isPaid 
      ? "مبلغ پرداخت شده قابل بازگشت نیست و آیا از حذف اطلاعات اطمینان دارید؟" 
      : "آیا از حذف این شغل اطمینان دارید؟";
    
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        setProfileData((prev: any) => ({
          ...prev,
          jobs: prev.jobs.filter((j: any) => j.id !== jobId)
        }));
        alert("شغل با موفقیت حذف شد.");
      } else {
        alert("خطا در حذف شغل.");
      }
    } catch (err) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleDeleteAd = async (adId: number, status: string) => {
    const isPaid = status === "FINAL" || status === "PAID";
    const msg = isPaid 
      ? "مبلغ پرداخت شده قابل بازگشت نیست و آیا از حذف اطلاعات اطمینان دارید؟" 
      : "آیا از حذف این آگهی اطمینان دارید؟";

    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/ads/${adId}`, { method: "DELETE" });
      if (res.ok) {
        setProfileData((prev: any) => ({
          ...prev,
          ads: prev.ads.filter((a: any) => a.id !== adId)
        }));
        alert("آگهی با موفقیت حذف شد.");
      } else {
        alert("خطا در حذف آگهی.");
      }
    } catch (err) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handlePayJob = (jobId: number) => {
    router.push(`/payment/checkout/job/${jobId}`);
  };

  const handlePayAd = (adId: number) => {
    router.push(`/payment/checkout/ad/${adId}`);
  };

  const getStatusInfo = (item: any) => {
    const status = typeof item === 'string' ? item : item.status;
    if (status === 'REJECTED' && item.adminNote && item.adminNote.startsWith('[NEEDS_EDIT]')) {
      return { label: 'نیاز به اصلاح', color: 'bg-orange-100 text-orange-700' };
    }
    
    switch (status) {
      case 'FINAL': return { label: 'تایید نهایی', color: 'bg-green-100 text-green-700' };
      case 'APPROVED': return { label: 'تایید اولیه', color: 'bg-blue-100 text-blue-700' };
      case 'PENDING': return { label: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-700' };
      case 'REJECTED': return { label: 'رد شده', color: 'bg-red-100 text-red-700' };
      case 'NEEDS_EDIT': return { label: 'نیاز به اصلاح', color: 'bg-orange-100 text-orange-700' };
      default: return { label: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getAdTypeLabel = (type: string) => {
    switch(type) {
      case 'EMPLOYMENT': return 'استخدام';
      case 'JOB_SEEKER': return 'جویای کار';
      case 'COMMERCIAL': return 'تجاری';
      case 'COMMERCIAL_FREE': return 'تجاری رایگان';
      default: return type;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <a href="/" className="hover:text-primary">خانه</a>
          <ChevronLeft size={12} />
          <span className="text-gray-700">پروفایل کاربری</span>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={28} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{session.user.name || session.user.mobile}</h2>
              <p className="text-sm text-gray-500 text-left" dir="ltr">{session.user.mobile}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            خروج
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap relative ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-primary hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge > 0 && (
                <span className={`absolute -top-1 -left-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  activeTab === tab.key ? "bg-white text-primary" : "bg-primary text-white"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {/* My Jobs */}
          {activeTab === "jobs" && (
            <div className="space-y-3">
              {profileData?.jobs?.length === 0 ? (
                <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">شغلی ثبت نشده</div>
              ) : (
                profileData?.jobs?.map((job: any) => {
                  const statusInfo = getStatusInfo(job);
                  return (
                  <div key={job.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">🏢</div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">{job.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">شهر: {job.city?.name}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => router.push(`/job/${job.id}`)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="مشاهده">
                        <Eye size={16} />
                      </button>
                      {(job.status === "FINAL" || job.status === "NEEDS_EDIT") && (
                        <button onClick={() => router.push(`/job/${job.id}/edit`)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="ویرایش">
                          <Edit size={16} />
                        </button>
                      )}
                      {job.status === "APPROVED" && (
                        <button onClick={() => handlePayJob(job.id)} className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-xs font-bold whitespace-nowrap" title="پرداخت">
                          پرداخت
                        </button>
                      )}
                      <button onClick={() => handleDeleteJob(job.id, job.status)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )})
              )}
            </div>
          )}

          {/* My Ads */}
          {activeTab === "ads" && (
            <div className="space-y-3">
              {profileData?.ads?.length === 0 ? (
                <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">آگهی ثبت نشده</div>
              ) : (
                profileData?.ads?.map((ad: any) => {
                  const statusInfo = getStatusInfo(ad);
                  return (
                  <div key={ad.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">{ad.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">نوع: {getAdTypeLabel(ad.type)}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${statusInfo.color}`}>{statusInfo.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {ad.status === "APPROVED" && ad.type === "COMMERCIAL" && (
                        <button onClick={() => handlePayAd(ad.id)} className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-xs font-bold whitespace-nowrap" title="پرداخت">
                          پرداخت
                        </button>
                      )}
                      <button onClick={() => router.push(`/ad/${ad.id}`)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="مشاهده">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDeleteAd(ad.id, ad.status)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )})
              )}
            </div>
          )}

          {/* Messages */}
          {activeTab === "messages" && (
            <div className="space-y-3">
              {profileData?.messages?.length === 0 ? (
                <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">پیامی ندارید</div>
              ) : (
                profileData?.messages?.map((msg: any) => (
                  <div key={msg.id} className={`bg-white rounded-xl border p-4 transition-shadow hover:shadow-md ${!msg.isRead ? "border-primary/30 bg-primary/5" : "border-gray-100"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        {!msg.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                        {msg.title}
                      </h3>
                      <span className="text-[10px] text-gray-400">{toJalali(msg.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tickets */}
          {activeTab === "tickets" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">ثبت تیکت جدید</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">موضوع</label>
                  <input type="text" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="موضوع تیکت"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">پیام</label>
                  <textarea value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    className="w-full h-32 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                </div>
                <button className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md">
                  ارسال تیکت
                </button>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
              <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Settings size={20} className="text-primary" />
                تنظیمات پروفایل
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">شماره موبایل (غیرقابل تغییر)</label>
                  <input type="text" value={session.user.mobile} disabled dir="ltr"
                    className="w-full px-4 py-2.5 text-sm bg-gray-100 border border-gray-200 text-gray-500 rounded-xl cursor-not-allowed text-left" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">نام و نام خانوادگی / نام نمایشی</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="نام نمایشی شما در سیستم"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ایمیل</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSaving} dir="ltr"
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left" />
                </div>

                {saveError && (
                  <p className="text-xs text-red-500 font-medium">{saveError}</p>
                )}

                <button 
                  onClick={handleUpdateProfile} disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md disabled:opacity-50 mt-4">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  ذخیره تغییرات
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
