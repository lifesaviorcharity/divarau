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
  Save,
  ShieldAlert,
  X,
  Zap,
  Star,
} from "lucide-react";
import Link from "next/link";
import { toJalali } from "@/lib/utils";
import { useUnreadStore } from "@/store/unreadStore";

type Tab = "jobs" | "ads" | "messages" | "tickets" | "settings";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("jobs");
  const { clearUnreadCount } = useUnreadStore();

  // Tickets
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState("");
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  // Profile data & loading
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Settings Form State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Modals
  const [viewingJob, setViewingJob] = useState<any | null>(null);
  const [viewingAd, setViewingAd] = useState<any | null>(null);
  const [viewModalImageIndex, setViewModalImageIndex] = useState(0);

  // Boost & VIP Modal States
  const [systemSettings, setSystemSettings] = useState<any>({});
  const [boostModalJob, setBoostModalJob] = useState<any | null>(null);
  const [selectedBoostPeriod, setSelectedBoostPeriod] = useState<"1" | "3" | "7">("3");
  const [vipModalJob, setVipModalJob] = useState<any | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => setSystemSettings(data))
        .catch(() => { });

      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          setProfileData(data);
          setUsername(data.username || "");
          setEmail(data.email || "");
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [status, router]);

  const unreadMessagesCount = profileData?.messages?.filter((m: any) => !m.isRead).length || 0;

  useEffect(() => {
    if (activeTab === "messages") {
      clearUnreadCount();
      if (profileData?.messages) {
        const unreadExist = profileData.messages.some((m: any) => !m.isRead);
        if (unreadExist) {
          setProfileData((prev: any) => ({
            ...prev,
            messages: prev?.messages?.map((m: any) => ({ ...m, isRead: true })) || []
          }));
          fetch("/api/profile/messages/read", { method: "POST" }).catch(console.error);
        }
      }
    }
  }, [activeTab, profileData?.messages, clearUnreadCount]);

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setTicketError("لطفاً موضوع و متن پیام را وارد کنید.");
      return;
    }
    setIsSubmittingTicket(true);
    setTicketError("");
    setTicketSuccess("");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: ticketSubject, message: ticketMessage })
      });
      const data = await res.json();
      if (res.ok) {
        setTicketSubject("");
        setTicketMessage("");
        setTicketSuccess("تیکت پشتیبانی شما با موفقیت ثبت شد.");
        setProfileData((prev: any) => ({
          ...prev,
          tickets: [data.ticket, ...(prev?.tickets || [])]
        }));
      } else {
        setTicketError(data.error || "خطا در ثبت تیکت");
      }
    } catch {
      setTicketError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

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

  const handleDeleteJob = async (jobId: number, jobStatus: string) => {
    const isPaid = jobStatus === "FINAL" || jobStatus === "PAID";
    const msg = isPaid
      ? "مبلغ پرداخت شده قابل بازگشت نیست. آیا از حذف این شغل اطمینان دارید؟"
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
    } catch {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleDeleteAd = async (adId: number, adStatus: string) => {
    const isPaid = adStatus === "FINAL" || adStatus === "PAID";
    const msg = isPaid
      ? "مبلغ پرداخت شده قابل بازگشت نیست. آیا از حذف این آگهی اطمینان دارید؟"
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
    } catch {
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
    const itemStatus = typeof item === "string" ? item : item.status;
    if (itemStatus === "REJECTED" && item.adminNote && item.adminNote.startsWith("[NEEDS_EDIT]")) {
      return { label: "نیاز به اصلاح", color: "bg-orange-100 text-orange-700" };
    }

    switch (itemStatus) {
      case "FINAL":
        return { label: "تایید نهایی", color: "bg-green-100 text-green-700" };
      case "APPROVED":
        return { label: "تایید اولیه", color: "bg-blue-100 text-blue-700" };
      case "PENDING":
        return { label: "در حال بررسی", color: "bg-yellow-100 text-yellow-700" };
      case "REJECTED":
        return { label: "رد شده", color: "bg-red-100 text-red-700" };
      case "NEEDS_EDIT":
        return { label: "نیاز به اصلاح", color: "bg-orange-100 text-orange-700" };
      case "EXPIRED":
        return { label: "منقضی شده", color: "bg-gray-200 text-gray-700" };
      default:
        return { label: itemStatus, color: "bg-gray-100 text-gray-700" };
    }
  };

  const getAdTypeLabel = (type: string) => {
    switch (type) {
      case "EMPLOYMENT":
        return "استخدام";
      case "JOB_SEEKER":
        return "جویای کار";
      case "COMMERCIAL":
        return "تجاری";
      case "COMMERCIAL_FREE":
        return "تجاری رایگان";
      default:
        return type;
    }
  };

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
    { key: "messages" as Tab, label: "پیام‌ها", icon: <MessageSquare size={18} />, badge: unreadMessagesCount },
    { key: "tickets" as Tab, label: "تیکت پشتیبانی", icon: <LifeBuoy size={18} /> },
    { key: "settings" as Tab, label: "تنظیمات حساب", icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb & Admin Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-primary">خانه</Link>
            <ChevronLeft size={12} />
            <span className="text-gray-700">پروفایل کاربری</span>
          </div>
          {session.user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex md:hidden items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <ShieldAlert size={14} />
              پنل مدیریت
            </Link>
          )}
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
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/";
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            خروج
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all relative cursor-pointer ${activeTab === tab.key
                ? "bg-secondary text-white shadow-sm"
                : "text-gray-500 hover:text-primary hover:bg-gray-50"
                }`}
            >
              {tab.icon}
              <span className="text-center leading-tight">{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className={`absolute -top-1 -left-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${activeTab === tab.key ? "bg-white text-primary" : "bg-primary text-white"
                  }`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {/* 1. My Jobs */}
          {activeTab === "jobs" && (
            <div className="space-y-3">
              {(!profileData?.jobs || profileData.jobs.length === 0) ? (
                <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">شغلی ثبت نشده</div>
              ) : (
                profileData.jobs.map((job: any) => {
                  const statusInfo = getStatusInfo(job);
                  return (
                    <div key={job.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">🏢</div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-800">{job.title}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-gray-400">شهر: {job.city?.name}</span>
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${statusInfo.color}`}>{statusInfo.label}</span>
                              {job.isVip && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md flex items-center gap-0.5">
                                  <Star size={10} className="fill-amber-600 text-amber-600" /> ویژه
                                </span>
                              )}
                              {job.isBoosted && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded-md flex items-center gap-0.5">
                                  <Zap size={10} className="fill-purple-600 text-purple-600" /> پله ({job.boostPeriod === "SEVEN_DAYS" ? "۷ روزه" : job.boostPeriod === "THREE_DAYS" ? "۳ روزه" : "۱ روزه"})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {job.status === "FINAL" && (
                            <>
                              <button
                                onClick={() => {
                                  setBoostModalJob(job);
                                  setSelectedBoostPeriod("3");
                                }}
                                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-purple-200 shadow-2xs whitespace-nowrap cursor-pointer"
                                title="نردبان و پله کردن آگهی"
                              >
                                <Zap size={13} className="text-purple-600 fill-purple-600" />
                                پله کردن
                              </button>

                              {!job.isVip && (
                                <button
                                  onClick={() => setVipModalJob(job)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-amber-200 shadow-2xs whitespace-nowrap cursor-pointer"
                                  title="ارتقا به اشتراک ویژه"
                                >
                                  <Star size={13} className="text-amber-500 fill-amber-500" />
                                  ارتقا به ویژه
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => {
                              setViewingJob(job);
                              setViewModalImageIndex(0);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="مشاهده اطلاعات کامل"
                          >
                            <Eye size={16} />
                          </button>
                          {(job.status === "FINAL" || job.status === "NEEDS_EDIT") && (
                            <button
                              onClick={() => router.push(`/job/${job.id}/edit`)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                              title="ویرایش"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {(job.status === "APPROVED" || job.status === "EXPIRED") && (
                            <button
                              onClick={() => handlePayJob(job.id)}
                              className="px-3 py-1.5 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-xs font-bold whitespace-nowrap shadow-sm cursor-pointer"
                              title={job.status === "EXPIRED" ? "تمدید اشتراک" : "پرداخت"}
                            >
                              {job.status === "EXPIRED" ? "تمدید اشتراک" : "پرداخت"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteJob(job.id, job.status)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {job.adminNote && (job.status === "NEEDS_EDIT" || job.status === "REJECTED") && (
                        <div className={`mt-3 p-3 rounded-xl text-xs border ${job.status === "NEEDS_EDIT" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                          <span className="font-bold">توضیح/دلیل ادمین: </span>
                          {job.adminNote.replace("[NEEDS_EDIT] ", "")}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. My Ads */}
          {activeTab === "ads" && (
            <div className="space-y-3">
              {(!profileData?.ads || profileData.ads.length === 0) ? (
                <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">آگهی ثبت نشده</div>
              ) : (
                profileData.ads.map((ad: any) => {
                  const statusInfo = getStatusInfo(ad);
                  return (
                    <div key={ad.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-gray-800">{ad.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400">نوع: {getAdTypeLabel(ad.type)}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {ad.status === "APPROVED" && ad.type === "COMMERCIAL" && (
                            <button
                              onClick={() => handlePayAd(ad.id)}
                              className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-xs font-bold whitespace-nowrap cursor-pointer"
                              title="پرداخت"
                            >
                              پرداخت
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setViewingAd(ad);
                              setViewModalImageIndex(0);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="مشاهده اطلاعات کامل"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id, ad.status)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {ad.adminNote && (ad.status === "REJECTED" || ad.adminNote.startsWith("[NEEDS_EDIT]")) && (
                        <div className="mt-3 p-3 rounded-xl text-xs border bg-amber-50 border-amber-200 text-amber-800">
                          <span className="font-bold">توضیح/دلیل ادمین: </span>
                          {ad.adminNote.replace("[NEEDS_EDIT] ", "")}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 3. Messages */}
          {activeTab === "messages" && (
            <div className="space-y-3">
              {(!profileData?.messages || profileData.messages.length === 0) ? (
                <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">پیامی ندارید</div>
              ) : (
                profileData.messages.map((msg: any) => (
                  <div key={msg.id} className={`bg-white rounded-xl border p-4 transition-shadow hover:shadow-md ${!msg.isRead ? "border-primary/30 bg-primary/5" : "border-gray-100"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        {!msg.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                        {msg.title}
                      </h3>
                      <span className="text-[10px] text-gray-400">{toJalali(msg.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. Tickets */}
          {activeTab === "tickets" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-4">ثبت تیکت جدید</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">موضوع</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => {
                        setTicketSubject(e.target.value);
                        setTicketError("");
                        setTicketSuccess("");
                      }}
                      placeholder="موضوع تیکت"
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">پیام</label>
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => {
                        setTicketMessage(e.target.value);
                        setTicketError("");
                        setTicketSuccess("");
                      }}
                      placeholder="پیام خود را بنویسید..."
                      className="w-full h-32 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>

                  {ticketError && (
                    <p className="text-xs text-red-500 font-medium">{ticketError}</p>
                  )}
                  {ticketSuccess && (
                    <p className="text-xs text-green-600 font-medium">{ticketSuccess}</p>
                  )}

                  <button
                    onClick={handleCreateTicket}
                    disabled={isSubmittingTicket}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingTicket && <Loader2 size={16} className="animate-spin" />}
                    ارسال تیکت
                  </button>
                </div>
              </div>

              {/* Tickets List */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-4">تیکت‌های پشتیبانی من</h3>
                {(!profileData?.tickets || profileData.tickets.length === 0) ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    هیچ تیکت پشتیبانی ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileData.tickets.map((t: any) => {
                      const isExpanded = expandedTicketId === t.id;
                      const statusMap: Record<string, { label: string; style: string }> = {
                        OPEN: { label: "باز", style: "bg-red-100 text-red-700" },
                        IN_PROGRESS: { label: "در حال بررسی", style: "bg-blue-100 text-blue-700" },
                        REPLIED: { label: "پاسخ داده شده", style: "bg-blue-100 text-blue-700" },
                        CLOSED: { label: "بسته شده", style: "bg-gray-100 text-gray-600" }
                      };
                      const statusInfo = statusMap[t.status] || { label: t.status, style: "bg-gray-100 text-gray-600" };

                      return (
                        <div key={t.id} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                            className="w-full p-4 bg-gray-50/50 hover:bg-gray-50 flex items-center justify-between text-right transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${statusInfo.style}`}>
                                {statusInfo.label}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-gray-800">{t.subject}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">{toJalali(new Date(t.createdAt))}</p>
                              </div>
                            </div>
                            <span className="text-xs text-primary font-medium">
                              {isExpanded ? "بستن جزئیات" : "مشاهده پیام‌ها"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="p-4 bg-white space-y-3 border-t border-gray-100">
                              {(t.messages || []).map((m: any) => (
                                <div
                                  key={m.id}
                                  className={`flex ${m.isAdmin ? "justify-start" : "justify-end"}`}
                                >
                                  <div
                                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${m.isAdmin
                                      ? "bg-primary/10 text-gray-800 rounded-tl-none border border-primary/20"
                                      : "bg-gray-100 text-gray-800 rounded-tr-none"
                                      }`}
                                  >
                                    <div className="font-bold text-[10px] text-gray-500 mb-1">
                                      {m.isAdmin ? "پشتیبانی سایت" : "شما"}
                                    </div>
                                    <p className="whitespace-pre-wrap">{m.content}</p>
                                    <div className="text-[9px] text-gray-400 mt-1.5 text-left">
                                      {toJalali(new Date(m.createdAt))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Settings */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Settings size={20} className="text-primary" />
                تنظیمات پروفایل
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">شماره موبایل (غیرقابل تغییر)</label>
                  <input
                    type="text"
                    value={session.user.mobile}
                    disabled
                    dir="ltr"
                    className="w-full px-4 py-2.5 text-sm bg-gray-100 border border-gray-200 text-gray-500 rounded-xl cursor-not-allowed text-left"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">نام و نام خانوادگی / نام نمایشی</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="نام نمایشی شما در سیستم"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ایمیل</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSaving}
                    dir="ltr"
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left"
                  />
                </div>

                {saveError && (
                  <p className="text-xs text-red-500 font-medium">{saveError}</p>
                )}

                <button
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  ذخیره تغییرات
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Job Modal */}
      {viewingJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col dir-rtl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  🏢
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">{viewingJob.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {viewingJob.category?.name} {viewingJob.subCategory?.name ? `> ${viewingJob.subCategory.name}` : ""}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${getStatusInfo(viewingJob).color}`}>
                      {getStatusInfo(viewingJob).label}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingJob(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Admin Note if any */}
              {viewingJob.adminNote && (
                <div className={`p-4 rounded-xl text-xs border ${viewingJob.status === "NEEDS_EDIT" ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-red-50 border-red-200 text-red-900"}`}>
                  <span className="font-bold">توضیح ادمین: </span>
                  {viewingJob.adminNote.replace("[NEEDS_EDIT] ", "")}
                </div>
              )}

              {/* Images Gallery */}
              {viewingJob.images && viewingJob.images.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 text-xs">تصاویر ثبت‌شده:</h4>
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative max-h-72 w-full max-w-lg mx-auto border border-gray-100 flex items-center justify-center">
                    <img
                      src={viewingJob.images[viewModalImageIndex]?.url}
                      alt={viewingJob.title}
                      className="w-full h-full object-contain bg-gray-900/5"
                    />
                    {viewingJob.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setViewModalImageIndex(Math.max(0, viewModalImageIndex - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setViewModalImageIndex(Math.min(viewingJob.images.length - 1, viewModalImageIndex + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center rotate-180 cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                      </>
                    )}
                  </div>

                  {viewingJob.images.length > 1 && (
                    <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                      {viewingJob.images.map((img: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setViewModalImageIndex(idx)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                            idx === viewModalImageIndex ? "border-primary shadow-sm" : "border-gray-200 opacity-70"
                          }`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description & Work Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-800 text-xs mb-1.5">توضیحات شغل:</h4>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{viewingJob.description}</p>
                </div>
                {viewingJob.workHours && (
                  <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 text-xs mb-1.5">ساعات کاری:</h4>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{viewingJob.workHours}</p>
                  </div>
                )}
              </div>

              {/* Registered Contact Information */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-blue-950 text-xs mb-2">اطلاعات تماس ثبت‌شده (مخصوص شما):</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {viewingJob.phone && (
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-blue-100">
                      <span className="text-gray-500">شماره تماس:</span>
                      <span className="font-bold text-gray-800 dir-ltr">{viewingJob.phone}</span>
                    </div>
                  )}

                  {viewingJob.city?.name && (
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-blue-100">
                      <span className="text-gray-500">شهر:</span>
                      <span className="font-bold text-gray-800">{viewingJob.city.name}</span>
                    </div>
                  )}

                  {viewingJob.address && (
                    <div className="sm:col-span-2 flex items-start justify-between bg-white p-2.5 rounded-lg border border-blue-100 gap-2">
                      <span className="text-gray-500 shrink-0">آدرس پستی:</span>
                      <span className="font-medium text-gray-800 text-left">{viewingJob.address}</span>
                    </div>
                  )}

                  {viewingJob.email && (
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-blue-100">
                      <span className="text-gray-500">ایمیل:</span>
                      <span className="font-medium text-blue-600 dir-ltr">{viewingJob.email}</span>
                    </div>
                  )}

                  {viewingJob.website && (
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-blue-100">
                      <span className="text-gray-500">وب‌سایت:</span>
                      <a href={viewingJob.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 dir-ltr truncate max-w-[180px]">
                        {viewingJob.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(viewingJob.whatsapp || viewingJob.telegram || viewingJob.instagram) && (
                  <div className="pt-2 border-t border-blue-100 flex items-center gap-3">
                    <span className="text-xs text-gray-500">شبکه‌های اجتماعی:</span>
                    {viewingJob.telegram && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium dir-ltr">
                        @{viewingJob.telegram}
                      </span>
                    )}
                    {viewingJob.whatsapp && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-md font-medium dir-ltr">
                        {viewingJob.whatsapp}
                      </span>
                    )}
                    {viewingJob.instagram && (
                      <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-md font-medium dir-ltr">
                        @{viewingJob.instagram}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {viewingJob.status === "APPROVED" && (
                  <button
                    onClick={() => { setViewingJob(null); handlePayJob(viewingJob.id); }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    پرداخت و فعال‌سازی نهایی
                  </button>
                )}
                {(viewingJob.status === "FINAL" || viewingJob.status === "NEEDS_EDIT") && (
                  <button
                    onClick={() => { setViewingJob(null); router.push(`/job/${viewingJob.id}/edit`); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    ویرایش اطلاعات
                  </button>
                )}
              </div>
              <button
                onClick={() => setViewingJob(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Ad Modal */}
      {viewingAd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col dir-rtl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div>
                <h3 className="font-bold text-base text-gray-900">{viewingAd.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">نوع: {getAdTypeLabel(viewingAd.type)}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${getStatusInfo(viewingAd).color}`}>
                    {getStatusInfo(viewingAd).label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingAd(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              {viewingAd.adminNote && (
                <div className="p-4 rounded-xl text-xs border bg-amber-50 border-amber-200 text-amber-900">
                  <span className="font-bold">توضیح ادمین: </span>
                  {viewingAd.adminNote.replace("[NEEDS_EDIT] ", "")}
                </div>
              )}

              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-800 text-xs mb-1.5">توضیحات آگهی:</h4>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{viewingAd.description || viewingAd.title}</p>
              </div>

              {viewingAd.phone && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">شماره تماس ثبت‌شده:</span>
                  <span className="text-sm font-bold text-primary dir-ltr">{viewingAd.phone}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
              {viewingAd.status === "APPROVED" && viewingAd.type === "COMMERCIAL" ? (
                <button
                  onClick={() => { setViewingAd(null); handlePayAd(viewingAd.id); }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  پرداخت و فعال‌سازی
                </button>
              ) : <div />}
              <button
                onClick={() => setViewingAd(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boost / Ladder Modal */}
      {boostModalJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-purple-50/60">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Zap className="text-purple-600 fill-purple-600" size={18} />
                پله و نردبان کردن شغل: {boostModalJob.title}
              </h3>
              <button
                onClick={() => setBoostModalJob(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                با پله کردن، آگهی شغلی شما مجدداً به بالای فهرست مشاغل می‌آید و برای مدت زمان انتخابی با نشان ویژه پله در معرض دید مخاطبان قرار می‌گیرد.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">مدت زمان پله شدن:</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { val: "1", label: "۱ روزه", price: systemSettings.priceBoost1 || "10" },
                    { val: "3", label: "۳ روزه", price: systemSettings.priceBoost3 || "25" },
                    { val: "7", label: "۷ روزه", price: systemSettings.priceBoost7 || "50" },
                  ].map((b) => (
                    <button
                      type="button"
                      key={b.val}
                      onClick={() => setSelectedBoostPeriod(b.val as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${selectedBoostPeriod === b.val
                        ? "border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-600/20"
                        : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                        }`}
                    >
                      <div className="font-bold text-xs">{b.label}</div>
                      <div className="text-xs font-black text-purple-700 mt-1">${b.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setBoostModalJob(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push(`/payment/checkout/job_boost/${boostModalJob.id}?period=${selectedBoostPeriod}`);
                }}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Zap size={14} /> پرداخت و فعال سازی پله
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIP Upgrade Modal */}
      {vipModalJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50/60">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Star className="text-amber-500 fill-amber-500" size={18} />
                ارتقا به اشتراک ویژه (VIP): {vipModalJob.title}
              </h3>
              <button
                onClick={() => setVipModalJob(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                با ارتقا به اشتراک ویژه، کسب‌وکار شما با کادر طلایی، برچسب VIP و اولویت نمایش در گروه شغلی و دسته‌بندی مربوطه به نمایش درخواهد آمد.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">هزینه ارتقا به ویژه</span>
                  <span className="text-[10px] text-amber-700">برای کل دوره اشتراک فعال</span>
                </div>
                <div className="text-lg font-black text-amber-900 font-mono">
                  ${systemSettings.priceVip || "30"}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setVipModalJob(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push(`/payment/checkout/job_vip/${vipModalJob.id}`);
                }}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Star size={14} /> پرداخت و ارتقا به ویژه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
