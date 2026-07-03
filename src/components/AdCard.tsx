"use client";

import { Clock, Tag } from "lucide-react";

export interface AdCardData {
  id: number;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  type: "commercial" | "employment" | "job_seeker";
  city: string;
  timeAgo: string;
}

interface AdCardProps {
  ad: AdCardData;
  onClick?: (id: number) => void;
}

export default function AdCard({ ad, onClick }: AdCardProps) {
  const typeLabels = {
    commercial: { label: "تجاری", color: "bg-amber-100 text-amber-700" },
    employment: { label: "استخدام", color: "bg-green-100 text-green-700" },
    job_seeker: { label: "جویای کار", color: "bg-blue-100 text-blue-700" },
  };

  const typeInfo = typeLabels[ad.type];

  return (
    <button
      onClick={() => onClick?.(ad.id)}
      className="w-full bg-white rounded-xl border border-gray-200 hover:border-gray-300 p-4 text-right transition-all duration-200 hover:shadow-md card-hover"
    >
      <div className="flex flex-row items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold text-gray-800 truncate flex-1">
          {ad.title}
        </h3>
        <span
          className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg flex-shrink-0 ${typeInfo.color}`}
        >
          {typeInfo.label}
        </span>
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
        {ad.description}
      </p>

      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <Tag size={10} />
          {ad.subCategory}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {ad.timeAgo}
        </span>
      </div>
    </button>
  );
}
