"use client";

import { useCityStore } from "@/store/cityStore";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { Loader2 } from "lucide-react";

export default function JobCategoriesGrid() {
  const { selectedCity, openCityModal } = useCityStore();
  const router = useRouter();
  const { categories: jobCategories, isLoading } = useCategories();

  const handleCategoryClick = (categoryIndex: number) => {
    router.push(`/jobs?category=${categoryIndex}`);
  };

  return (
    <section className="py-10">
      <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 mb-8">
        فهرست گروه‌های شغلی
      </h2>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
        {jobCategories.map((category, index) => (
          <button
            key={category.name}
            onClick={() => handleCategoryClick(index)}
            className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 hover:border-primary/30 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 card-hover"
          >
            <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">
              {category.icon}
            </span>
            <span className="text-xs md:text-sm font-semibold text-gray-700 group-hover:text-primary text-center leading-relaxed transition-colors">
              {category.name}
            </span>
          </button>
        ))}
      </div>
      )}
    </section>
  );
}
