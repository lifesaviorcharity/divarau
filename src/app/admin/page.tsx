import { Briefcase, FileText, Users, CreditCard, TrendingUp, Clock } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatPrice, toJalali, formatPersianNumber } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [
    totalUsers,
    totalJobs,
    totalAds,
    pendingJobs,
    recentPayments
  ] = await Promise.all([
    prisma.user.count(),
    prisma.job.count({ where: { status: 'FINAL' } }),
    prisma.ad.count({ where: { status: 'FINAL' } }),
    prisma.job.findMany({ 
      where: { status: 'PENDING' },
      include: { user: true, city: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    }),
    // For demo purposes, we fetch ads as recent payments
    prisma.ad.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
  ]);

  const stats = [
    { label: "مشاغل تایید شده", value: formatPersianNumber(totalJobs), icon: <Briefcase size={24} />, color: "text-primary", bg: "bg-primary/10", change: "بروز" },
    { label: "آگهی‌های فعال", value: formatPersianNumber(totalAds), icon: <FileText size={24} />, color: "text-blue-600", bg: "bg-blue-50", change: "بروز" },
    { label: "کل کاربران", value: formatPersianNumber(totalUsers), icon: <Users size={24} />, color: "text-green-600", bg: "bg-green-50", change: "بروز" },
    { label: "درآمد (AUD)", value: formatPrice(0), icon: <CreditCard size={24} />, color: "text-amber-600", bg: "bg-amber-50", change: "بزودی" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-800">داشبورد</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
                <TrendingUp size={12} />
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-black text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Jobs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              مشاغل در انتظار بررسی
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
              {formatPersianNumber(pendingJobs.length)}
            </span>
          </div>
          <div className="p-3">
            {pendingJobs.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">موردی یافت نشد</p>
            ) : pendingJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{job.title}</p>
                  <p className="text-[10px] text-gray-400">{job.user.username || job.user.mobile} — {job.city.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">{toJalali(job.createdAt)}</span>
                  <button className="px-3 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">بررسی</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments (Mocked using Ads for now) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <CreditCard size={16} className="text-green-500" />
              آخرین پرداخت‌ها (نمایشی)
            </h3>
          </div>
          <div className="p-3">
            {recentPayments.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">موردی یافت نشد</p>
            ) : recentPayments.map((pay) => (
              <div key={pay.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{pay.user.username || pay.user.mobile}</p>
                  <p className="text-[10px] text-gray-400">PayPal — {toJalali(pay.createdAt)}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">$25.00</p>
                  <span className={`text-[10px] font-semibold text-green-600`}>موفق</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
