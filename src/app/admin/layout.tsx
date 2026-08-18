"use client";

import { useState, useEffect, useCallback } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Image as ImageIcon,
  CreditCard,
  Settings,
  BarChart3,
  MessageSquare,
  Star,
  Tags,
  Menu,
  X,
  MapPin,
  Clock,
  User,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { formatPersianNumber } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarItems: {
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeKey?: "messages" | "reviews";
}[] = [
  { label: "داشبورد", href: "/admin", icon: <LayoutDashboard size={18} /> },
  { label: "مدیریت مشاغل", href: "/admin/jobs", icon: <Briefcase size={18} /> },
  { label: "مدیریت آگهی ها", href: "/admin/ads", icon: <FileText size={18} /> },
  { label: "مدیریت دسته‌بندی ها", href: "/admin/categories", icon: <Tags size={18} /> },
  { label: "مدیریت شهرها", href: "/admin/cities", icon: <MapPin size={18} /> },
  { label: "مدیریت کاربران", href: "/admin/users", icon: <Users size={18} /> },
  { label: "مدیریت بنرها", href: "/admin/banners", icon: <ImageIcon size={18} /> },
  { label: "مدیریت پرداخت ها", href: "/admin/payments", icon: <CreditCard size={18} /> },
  { label: "مدیریت نظرات", href: "/admin/reviews", icon: <Star size={18} />, badgeKey: "reviews" },
  { label: "پیام‌ها و تیکت ها", href: "/admin/messages", icon: <MessageSquare size={18} />, badgeKey: "messages" },
  { label: "گزارش ها", href: "/admin/reports", icon: <BarChart3 size={18} /> },
  { label: "گزارش انقضا", href: "/admin/expiring", icon: <Clock size={18} /> },
  { label: "تنظیمات", href: "/admin/settings", icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const [badgeCounts, setBadgeCounts] = useState<{
    messages?: number;
    reviews?: number;
  }>({});
  const { data: session, status } = useSession();

  // Redirect non-admins or unauthenticated users immediately
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/auth/login?callbackUrl=" + encodeURIComponent(pathname));
    } else if (session.user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [session, status, router, pathname]);

  const fetchBadgeCounts = useCallback(async () => {
    if (!pathname.startsWith("/admin") || session?.user?.role !== "ADMIN") return;
    try {
      if (typeof document !== "undefined" && document.hidden) return;
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setBadgeCounts((prev) => {
          const newMsg = data.openTickets || 0;
          const newRev = data.pendingReviews || 0;
          if (prev.messages === newMsg && prev.reviews === newRev) {
            return prev; // Skip re-render if data is identical
          }
          return {
            messages: newMsg,
            reviews: newRev,
          };
        });
      }
    } catch (err) {
      console.error("Failed to fetch badge counts:", err);
    }
  }, [pathname, session?.user?.role]);

  // Fetch immediately on mount and set up 30s interval + visibility / custom event listeners
  useEffect(() => {
    if (!pathname.startsWith("/admin") || session?.user?.role !== "ADMIN") return;

    fetchBadgeCounts();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchBadgeCounts();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchBadgeCounts();
      }
    };

    const handleStatsUpdate = () => {
      fetchBadgeCounts();
    };

    window.addEventListener("admin-stats-update", handleStatsUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("admin-stats-update", handleStatsUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, session?.user?.role, fetchBadgeCounts]);

  // Reset loading state and refresh counts when pathname changes
  useEffect(() => {
    setLoadingHref(null);
    if (pathname.startsWith("/admin") && session?.user?.role === "ADMIN") {
      fetchBadgeCounts();
    }
  }, [pathname, session?.user?.role, fetchBadgeCounts]);

  // Safety fallback: reset loading state after 8 seconds if navigation stalled
  useEffect(() => {
    if (!loadingHref) return;
    const timer = setTimeout(() => {
      setLoadingHref(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [loadingHref]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-gray-500">در حال بررسی سطح دسترسی...</p>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center space-y-4 animate-scale-in">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-lg font-bold text-gray-800">عدم دسترسی به پنل مدیریت</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            حساب کاربری شما مجوز دسترسی به بخش مدیریت را ندارد.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : (session?.user?.mobile ? session.user.mobile.charAt(session.user.mobile.startsWith('0') ? 1 : 0) : "A");

  return (
    <div className="flex items-start min-h-screen bg-gray-50">
      {/* Desktop Sidebar - always visible on lg+ */}
      <aside
        className="hidden lg:flex shrink-0 print:hidden"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '16rem',
          flexDirection: 'column',
          background: '#111827',
          color: '#d1d5db',
          overflow: 'hidden'
        }}
      >
        <div className="px-6 py-5 border-b border-gray-800">
          <Link href="/admin" className="text-xl font-black text-white">
            پنل مدیریت
          </Link>
          <p className="text-[10px] text-gray-500 mt-1">AUIR Admin Panel</p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const isLoading = loadingHref === item.href;
            const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (pathname !== item.href) {
                    setLoadingHref(item.href);
                  }
                }}
                className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isLoading
                    ? "bg-gray-800 text-amber-400 ring-1 ring-amber-500/50 shadow-inner"
                    : isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin text-amber-400 shrink-0" />
                  ) : (
                    item.icon
                  )}
                  <span className={isLoading ? "text-amber-300 font-semibold" : ""}>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {badgeCount > 0 && (
                    <span
                      className="bg-white text-gray-900 font-bold text-[11px] px-2 py-0.5 rounded-full shadow-xs shrink-0 flex items-center justify-center min-w-[22px] h-[18px] leading-none"
                      title={`${badgeCount} مورد جدید`}
                    >
                      {badgeCount > 99 ? "۹۹+" : formatPersianNumber(badgeCount)}
                    </span>
                  )}
                  {isLoading && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-800">
          <Link href="/" className="text-xs text-gray-500 hover:text-primary transition-colors">
            ← بازگشت به سایت
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay - only on mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden print:hidden"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Dark backdrop */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }} />

          {/* Sidebar panel - stop click propagation so clicking inside doesn't close */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '16rem', display: 'flex', flexDirection: 'column', background: '#111827', color: '#d1d5db', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}
          >
            <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center">
              <div>
                <Link href="/admin" className="text-xl font-black text-white" onClick={() => setIsMobileMenuOpen(false)}>
                  پنل مدیریت
                </Link>
                <p className="text-[10px] text-gray-500 mt-1">AUIR Admin Panel</p>
              </div>
              <div
                role="button"
                tabIndex={0}
                className="p-3 text-gray-400 hover:text-white cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setIsMobileMenuOpen(false); }}
              >
                <X size={24} />
              </div>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                const isLoading = loadingHref === item.href;
                const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (pathname !== item.href) {
                        setLoadingHref(item.href);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isLoading
                        ? "bg-gray-800 text-amber-400 ring-1 ring-amber-500/50 shadow-inner"
                        : isActive
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin text-amber-400 shrink-0" />
                      ) : (
                        item.icon
                      )}
                      <span className={isLoading ? "text-amber-300 font-semibold" : ""}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {badgeCount > 0 && (
                        <span
                          className="bg-white text-gray-900 font-bold text-[11px] px-2 py-0.5 rounded-full shadow-xs shrink-0 flex items-center justify-center min-w-[22px] h-[18px] leading-none"
                          title={`${badgeCount} مورد جدید`}
                        >
                          {badgeCount > 99 ? "۹۹+" : formatPersianNumber(badgeCount)}
                        </span>
                      )}
                      {isLoading && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="px-4 py-4 border-t border-gray-800">
              <Link href="/" className="text-xs text-gray-500 hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                ← بازگشت به سایت
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-bold text-gray-700 hidden sm:block">مدیریت سایت</h2>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-primary font-semibold flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
              بازگشت به سایت
            </Link>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <Link href="/profile" className="flex items-center gap-2 group cursor-pointer" title="حساب کاربری">
              <span className="text-xs text-gray-600 group-hover:text-primary transition-colors hidden sm:block">مدیر سیستم</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                <User size={18} />
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
