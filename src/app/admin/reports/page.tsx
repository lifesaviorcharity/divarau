"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Briefcase, FileText, CreditCard, MapPin, Calendar, Download, Loader2 } from "lucide-react";

interface ReportData {
  summary: {
    jobs: number;
    ads: number;
    users: number;
    revenue: number;
    jobTrend: string;
    adTrend: string;
    userTrend: string;
    revenueTrend: string;
  };
  cityStats: { city: string; jobs: number; ads: number; users: number }[];
  categoryStats: { name: string; count: number; percent: number }[];
  chartData: { label: string; jobs: number; ads: number; revenue: number }[];
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/reports?period=${period}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch report data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const maxChart = data?.chartData ? Math.max(1, ...data.chartData.map((d) => d.jobs), ...data.chartData.map((d) => d.ads)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">گزارش‌ها و آمار</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
            {[
              { key: "week" as const, label: "هفته" },
              { key: "month" as const, label: "ماه" },
              { key: "year" as const, label: "سال" },
            ].map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  period === p.key ? "bg-white text-primary shadow-sm" : "text-gray-500"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors shadow-md">
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* Summary */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
          {[
            { label: "مشاغل جدید", value: data.summary.jobs.toString(), icon: <Briefcase size={20} />, color: "text-primary", bg: "bg-primary/10", trend: data.summary.jobTrend },
            { label: "آگهی‌های جدید", value: data.summary.ads.toString(), icon: <FileText size={20} />, color: "text-blue-600", bg: "bg-blue-50", trend: data.summary.adTrend },
            { label: "کاربران جدید", value: data.summary.users.toString(), icon: <Users size={20} />, color: "text-green-600", bg: "bg-green-50", trend: data.summary.userTrend },
            { label: "درآمد ($)", value: data.summary.revenue.toLocaleString(), icon: <CreditCard size={20} />, color: "text-amber-600", bg: "bg-amber-50", trend: data.summary.revenueTrend },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${stat.trend.startsWith('-') ? 'text-red-500' : 'text-green-600'}`}>
                  <TrendingUp size={10} className={stat.trend.startsWith('-') ? 'rotate-180' : ''} />{stat.trend}
                </span>
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
              </div>
              <p className="text-xl font-black text-gray-800">{stat.value}</p>
              <p className="text-[10px] text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Chart (Bar visualization) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            روند ماهانه ثبت مشاغل و آگهی‌ها
          </h3>
          <div className="space-y-3 min-h-[150px]">
            {loading ? (
              <div className="flex justify-center items-center h-full pt-10"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : data?.chartData.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-gray-500 w-16 text-right">{d.label}</span>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 py-1 border-r-2 border-gray-100 pr-2">
                  <div className="h-5 bg-primary rounded-l-lg transition-all duration-500 flex items-center justify-end px-1.5 overflow-hidden"
                    style={{ width: `${Math.max(3, (d.jobs / maxChart) * 90)}%` }}>
                    {d.jobs > 0 && <span className="text-[9px] text-white font-bold">{d.jobs}</span>}
                  </div>
                  <div className="h-5 bg-blue-500 rounded-l-lg transition-all duration-500 flex items-center justify-end px-1.5 overflow-hidden"
                    style={{ width: `${Math.max(3, (d.ads / maxChart) * 90)}%` }}>
                    {d.ads > 0 && <span className="text-[9px] text-white font-bold">{d.ads}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, backgroundColor: '#c0392b', flexShrink: 0 }} />
              <span className="text-[11px] text-gray-500">مشاغل</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, backgroundColor: '#3b82f6', flexShrink: 0 }} />
              <span className="text-[11px] text-gray-500">آگهی‌ها</span>
            </div>
          </div>
        </div>

        {/* Category Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" />
            توزیع مشاغل بر اساس گروه
          </h3>
          <div className="space-y-3 min-h-[150px]">
            {loading ? (
              <div className="flex justify-center items-center h-full pt-10"><Loader2 className="animate-spin text-blue-600" size={24} /></div>
            ) : data?.categoryStats.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-gray-700 w-32 truncate text-right">{cat.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-primary to-accent rounded-full transition-all duration-700 flex items-center justify-end px-2"
                    style={{ width: `${Math.max(5, cat.percent)}%` }}>
                    {cat.percent > 5 && <span className="text-[8px] text-white font-bold">{cat.percent}%</span>}
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-8 text-left">{cat.count}</span>
              </div>
            ))}
            {data?.categoryStats.length === 0 && !loading && (
               <p className="text-xs text-gray-400 text-center py-10">اطلاعاتی یافت نشد</p>
            )}
          </div>
        </div>
      </div>

      {/* City Stats Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={16} className="text-green-600" />
            آمار به تفکیک شهر
          </h3>
        </div>
        <div style={{ overflowX: 'scroll', WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">شهر</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">مشاغل</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">آگهی‌ها</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">کاربران</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">سهم مشاغل</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="animate-spin text-green-600 mx-auto" size={24} />
                  </td>
                </tr>
              ) : data?.cityStats.map((city) => {
                const totalJobs = data.cityStats.reduce((s, c) => s + c.jobs, 0);
                const pct = totalJobs > 0 ? Math.round((city.jobs / totalJobs) * 100) : 0;
                return (
                  <tr key={city.city} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-800">{city.city}</td>
                    <td className="px-4 py-3 text-gray-600">{city.jobs}</td>
                    <td className="px-4 py-3 text-gray-600">{city.ads}</td>
                    <td className="px-4 py-3 text-gray-600">{city.users > 0 ? city.users : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data?.cityStats.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400">اطلاعاتی یافت نشد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
