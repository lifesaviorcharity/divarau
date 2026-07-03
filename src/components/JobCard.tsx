"use client";

import { Star, Eye, Clock } from "lucide-react";

export interface JobCardData {
  id: number;
  title: string;
  category: string;
  subCategory: string;
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  city: string;
  timeAgo: string;
  isVip: boolean;
}

interface JobCardProps {
  job: JobCardData;
  onClick?: (id: number) => void;
}

export default function JobCard({ job, onClick }: JobCardProps) {
  return (
    <button
      onClick={() => onClick?.(job.id)}
      className="w-full bg-white rounded-xl border border-gray-100 hover:border-gray-300 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group text-right card-hover"
    >
      <div className="flex flex-row-reverse gap-3 p-3">
        {/* Image */}
        <div className="w-32 h-32 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
          {job.imageUrl ? (
            <img
              src={job.imageUrl}
              alt={job.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-gray-50 to-gray-100">
              🏢
            </div>
          )}
          {job.isVip && (
            <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-gold text-white text-[9px] font-bold rounded-md">
              ویژه
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 truncate group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {job.subCategory}
            </p>
          </div>

          {/* Time */}
          <div>
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Clock size={10} />
              {job.timeAgo}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">

            {/* Rating */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={
                    i < Math.round(job.rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-200 fill-gray-200"
                  }
                />
              ))}
              {job.reviewCount > 0 && (
                <span className="text-[10px] text-gray-400 mr-1">
                  ({job.reviewCount})
                </span>
              )}
            </div>

          </div>
        </div>
      </div>
    </button>
  );
}
