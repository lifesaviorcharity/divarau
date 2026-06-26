"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Search,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

import Image from "next/image";
import logoDivar from "@/app/LOGO-Divar.jpg";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdSubmenuOpen, setIsAdSubmenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedCity, openCityModal, isCityModalOpen } = useCityStore();
  const adSubmenuRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

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
        {/* Main Page Logo Container */}
        {pathname === "/" && (
          <div className="hidden md:flex justify-center py-3 bg-white/50">
            <Link href="/">
              <Image
                src={logoDivar}
                alt="AUIR Logo"
                className="w-32 h-auto rounded-xl shadow-sm"
                priority
              />
            </Link>
          </div>
        )}

        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20 relative">
            {/* Logo and City Selector */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className={`md:static md:transform-none flex items-center gap-2 group ${pathname === "/" ? "md:hidden" : ""}`}
              >
                <Image
                  src={logoDivar}
                  alt="AUIR Logo"
                  className="w-10 h-auto md:w-12 rounded-lg"
                />
                <span className="hidden sm:block text-xs text-gray-500 leading-tight">
                  مشاغل ایرانیان
                  <br />
                  استرالیا
                </span>
              </Link>

              {/* City Selector Button */}
              {pathname !== "/" && (
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
              )}
            </div>

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

            {/* Search Bar - visible when desktop nav is hidden */}
            <form
              onSubmit={handleSearch}
              className="flex-1 max-w-xs mx-2 lg:hidden"
            >
              <div className="relative">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی مشاغل و آگهی‌ها..."
                  className="w-full pr-9 pl-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400 transition-all"
                />
              </div>
            </form>

            {/* Right side: Auth */}
            <div className="flex items-center gap-2">

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
                    <span className="hidden sm:inline">دیوار من</span>
                  </Link>
                  {pathname.startsWith("/profile") && (
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="خروج"
                    >
                      <LogOut size={18} />
                    </button>
                  )}
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
