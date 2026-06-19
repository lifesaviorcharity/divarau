"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useCityStore } from "@/store/cityStore";
import CitySelector from "./CitySelector";
import {
  Menu,
  X,
  ChevronDown,
  MapPin,
  Building2,
  FileText,
  Briefcase,
  Info,
  Headphones,
  UserCircle,
  User,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdSubmenuOpen, setIsAdSubmenuOpen] = useState(false);
  const { selectedCity, openCityModal, isCityModalOpen } = useCityStore();
  const adSubmenuRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAdSubmenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        window.innerWidth >= 1024 &&
        adSubmenuRef.current &&
        !adSubmenuRef.current.contains(event.target as Node)
      ) {
        setIsAdSubmenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    {
      label: "مشاهده مشاغل و آگهی‌ها",
      href: "/jobs",
      icon: <Building2 size={18} />,
    },
    {
      label: "ثبت مشاغل",
      href: "/register-job",
      icon: <Briefcase size={18} />,
    },
    {
      label: "ثبت آگهی",
      href: "#",
      icon: <FileText size={18} />,
      hasSubmenu: true,
      submenu: [
        { label: "آگهی‌های رایگان", href: "/register-ad/free" },
        { label: "آگهی‌های تجاری", href: "/register-ad/commercial" },
      ],
    },
    { label: "درباره ما", href: "/about", icon: <Info size={18} /> },
    {
      label: "پشتیبانی",
      href: "/support",
      icon: <Headphones size={18} />,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl md:text-3xl font-black gradient-text tracking-tight">
                AUIR
              </span>
              <span className="hidden sm:block text-xs text-gray-500 leading-tight">
                مشاغل ایرانیان
                <br />
                استرالیا
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) =>
                item.hasSubmenu ? (
                  <div key={item.label} className="relative" ref={adSubmenuRef}>
                    <button
                      onClick={() => setIsAdSubmenuOpen(!isAdSubmenuOpen)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      {item.icon}
                      {item.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isAdSubmenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isAdSubmenuOpen && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-scale-in z-50">
                        {item.submenu!.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                            onClick={() => setIsAdSubmenuOpen(false)}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Right side: City + Auth */}
            <div className="flex items-center gap-2">
              {/* City Selector Button */}
              <button
                onClick={openCityModal}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all duration-200"
              >
                <MapPin size={16} className="text-primary" />
                <span className="hidden sm:inline text-gray-700">
                  {selectedCity ? selectedCity.name : "انتخاب شهر"}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {/* Auth Button */}
              {status === "loading" ? (
                <div className="flex items-center gap-1.5 px-3 py-2 w-28 h-9 bg-gray-100 rounded-xl animate-pulse"></div>
              ) : session ? (
                <div className="flex items-center gap-2">
                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all duration-200 shadow-sm"
                      title="پنل مدیریت"
                    >
                      <ShieldAlert size={16} />
                      <span className="hidden lg:inline">مدیریت</span>
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200"
                  >
                    <User size={18} className="text-primary" />
                    <span className="hidden sm:inline" dir={session.user.name && /[\u0600-\u06FF]/.test(session.user.name) ? "rtl" : "ltr"}>{session.user.name}</span>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="خروج"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <UserCircle size={18} />
                  <span className="hidden sm:inline">ورود / ثبت نام</span>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 animate-fade-in">
            <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {menuItems.map((item) =>
                item.hasSubmenu ? (
                  <div key={item.label}>
                    <button
                      onClick={() => setIsAdSubmenuOpen(!isAdSubmenuOpen)}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.label}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${isAdSubmenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isAdSubmenuOpen && (
                      <div className="mr-8 space-y-1 mt-1">
                        {item.submenu!.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              )}
              {session?.user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors mt-2"
                >
                  <ShieldAlert size={18} />
                  پنل مدیریت
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* City Modal */}
      {isCityModalOpen && <CitySelector />}
    </>
  );
}
