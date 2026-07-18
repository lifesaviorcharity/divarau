"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  Eye,
  ArrowRight,
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function AdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [ad, setAd] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/ads/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setAd(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [params.id]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">در حال بارگذاری...</div>;
  }

  if (!ad || ad.error) {
    return <div className="min-h-screen flex items-center justify-center">آگهی یافت نشد یا مشکلی رخ داده است.</div>;
  }

  const isFinal = ad.status === "FINAL" || ad.status === "PAID";

  const typeLabels = {
    commercial: "تجاری",
    commercial_free: "تجاری رایگان",
    employment: "استخدام",
    job_seeker: "جویای کار",
  };

  const adTypeLabel = typeLabels[ad.type.toLowerCase() as keyof typeof typeLabels] || ad.type;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header Actions & Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <a href="/" className="hover:text-primary">خانه</a>
            <ChevronLeft size={12} />
            <a href="/jobs" className="hover:text-primary">مشاغل و آگهی‌ها</a>
            <ChevronLeft size={12} />
            <span className="text-gray-700 truncate max-w-[150px] sm:max-w-xs">{ad.title}</span>
          </div>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowRight size={16} />
            بازگشت
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          {/* Category Badge */}
          <p className="text-xs text-gray-500 mb-2">
            نوع آگهی: {adTypeLabel} | گروه: {ad.category?.name}
          </p>

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-2">
            {ad.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-6">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              در {ad.city?.name}
            </span>
          </div>



          {/* Description */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-bold text-gray-800 mb-2">توضیحات:</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{ad.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
