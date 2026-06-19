"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Clock
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { label: "داشبورد", href: "/admin", icon: <LayoutDashboard size={18} /> },
  { label: "مدیریت مشاغل", href: "/admin/jobs", icon: <Briefcase size={18} /> },
  { label: "مدیریت آگهی‌ها", href: "/admin/ads", icon: <FileText size={18} /> },
  { label: "مدیریت دسته‌بندی‌ها", href: "/admin/categories", icon: <Tags size={18} /> },
  { label: "مدیریت شهرها", href: "/admin/cities", icon: <MapPin size={18} /> },
  { label: "مدیریت کاربران", href: "/admin/users", icon: <Users size={18} /> },
  { label: "مدیریت بنرها", href: "/admin/banners", icon: <ImageIcon size={18} /> },
  { label: "مدیریت پرداخت‌ها", href: "/admin/payments", icon: <CreditCard size={18} /> },
  { label: "مدیریت نظرات", href: "/admin/reviews", icon: <Star size={18} /> },
  { label: "پیام‌ها و تیکت‌ها", href: "/admin/messages", icon: <MessageSquare size={18} /> },
  { label: "گزارش‌ها", href: "/admin/reports", icon: <BarChart3 size={18} /> },
  { label: "گزارش انقضا", href: "/admin/expiring", icon: <Clock size={18} /> },
  { label: "تنظیمات", href: "/admin/settings", icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : (session?.user?.mobile ? session.user.mobile.charAt(session.user.mobile.startsWith('0') ? 1 : 0) : "A");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-gray-900 text-gray-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center">
          <div>
            <Link href="/admin" className="text-xl font-black text-white" onClick={() => setIsMobileMenuOpen(false)}>
              پنل مدیریت
            </Link>
            <p className="text-[10px] text-gray-500 mt-1">AUIR Admin Panel</p>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
              >
                {item.icon}
                {item.label}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
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
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm group-hover:bg-primary group-hover:text-white transition-colors shadow-sm uppercase">
                {userInitial}
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
