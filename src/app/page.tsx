"use client";

import { useState, useEffect } from "react";
import BannerSlider from "@/components/BannerSlider";
import JobCategoriesGrid from "@/components/JobCategoriesGrid";
import { useCityStore } from "@/store/cityStore";
import { formatPersianNumber } from "@/lib/utils";
import { MapPin, Search, Star, Users, Building2, ChevronDown } from "lucide-react";

export default function HomePage() {
  const { selectedCity, openCityModal } = useCityStore();
  const [stats, setStats] = useState({
    totalJobs: 500,
    totalUsers: 1200,
    totalSearches: 3000,
    satisfaction: 98
  });

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => {
        if(!data.error) setStats(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Slogan + Flags */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-3xl">🇦🇺</span>
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold text-primary">
                  پیدا کن، معرفی شو، ارتباط بگیر!
                </p>
                <p className="text-sm md:text-base text-gray-600 font-medium mt-1">
                  مشاغل ایرانیان و فارسی‌زبانان استرالیا AUIR
                </p>
              </div>
              <span className="text-3xl">🇮🇷</span>
            </div>
          </div>

          {/* Banner Slider */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <BannerSlider />
          </div>

          {/* City Selector - Prominent */}
          <div
            className="max-w-md mx-auto mb-6 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <button
              onClick={openCityModal}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-white rounded-2xl border-2 border-gray-200 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <span className="flex items-center gap-2 text-gray-500 group-hover:text-primary transition-colors">
                <MapPin size={20} className="text-primary" />
                <span className="text-sm font-medium">
                  {selectedCity
                    ? selectedCity.name
                    : "شهر خود را انتخاب کنید..."}
                </span>
              </span>
              <ChevronDown
                size={18}
                className="text-gray-400 group-hover:text-primary transition-colors"
              />
            </button>
          </div>
        </div>
      </section>

      {/* Job Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <JobCategoriesGrid />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-14 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <Building2 size={28} />,
                value: formatPersianNumber(stats.totalJobs) + "+",
                label: "شغل ثبت شده",
                color: "text-primary",
                bg: "bg-primary/5",
              },
              {
                icon: <Users size={28} />,
                value: formatPersianNumber(stats.totalUsers) + "+",
                label: "کاربر فعال",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: <Search size={28} />,
                value: formatPersianNumber(stats.totalSearches) + "+",
                label: "جستجوی روزانه",
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                icon: <Star size={28} />,
                value: formatPersianNumber(stats.satisfaction) + "٪",
                label: "رضایت کاربران",
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`${stat.bg} rounded-2xl p-5 text-center card-hover animate-fade-in`}
                style={{ animationDelay: `${0.4 + i * 0.1}s` }}
              >
                <div
                  className={`${stat.color} flex justify-center mb-3`}
                >
                  {stat.icon}
                </div>
                <p className={`text-2xl md:text-3xl font-black ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-primary via-primary-dark to-secondary p-8 md:p-12 text-center text-white shadow-2xl shadow-primary/20">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-black mb-4">
                کسب‌وکار خود را معرفی کنید
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-8 max-w-xl mx-auto leading-relaxed">
                با ثبت شغل خود در AUIR، هزاران ایرانی مقیم استرالیا می‌توانند
                شما را پیدا کنند. همین الان شروع کنید!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="/register-job"
                  className="px-8 py-3 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-300 text-sm"
                >
                  ثبت شغل رایگان
                </a>
                <a
                  href="/jobs"
                  className="px-8 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-sm"
                >
                  مشاهده مشاغل
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
