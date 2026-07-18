"use client";

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Search, ChevronDown, ChevronLeft, Loader2, CircleCheckBig } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface CategorySidebarProps {
  selectedCategoryIndex: number | null;
  selectedSubCategorySlug: string | null;
  onSelectCategory: (index: number | null) => void;
  onSelectSubCategory: (categoryIndex: number | null, subSlug: string | null) => void;
}

export default function CategorySidebar({
  selectedCategoryIndex,
  selectedSubCategorySlug,
  onSelectCategory,
  onSelectSubCategory,
}: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories: jobCategories, isLoading } = useCategories();

  const qQuery = searchParams.get("q") || "";
  const [globalSearch, setGlobalSearch] = useState(qQuery);

  const [expandedCategory, setExpandedCategory] = useState<number | null>(
    selectedCategoryIndex
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"category" | "subcategory">(
    "category"
  );

  useEffect(() => {
    if (selectedCategoryIndex !== null) {
      setExpandedCategory(selectedCategoryIndex);
    } else {
      setExpandedCategory(null);
    }
  }, [selectedCategoryIndex]);

  // Sync state with URL search param
  useEffect(() => {
    setGlobalSearch(qQuery);
  }, [qQuery]);

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(globalSearch.trim())}`);
    } else {
      router.push('/jobs');
    }
  };

  const handleCategoryClick = (index: number) => {
    if (expandedCategory === index) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(index);
    }
    onSelectCategory(index);
    setSearchMode("subcategory");
  };

  const handleSubCategoryClick = (categoryIndex: number, subSlug: string) => {
    onSelectSubCategory(categoryIndex, subSlug);
  };

  // Filter based on search
  const getFilteredCategories = () => {
    if (!searchTerm) return jobCategories.map((cat, i) => ({ ...cat, originalIndex: i }));

    if (searchMode === "category") {
      return jobCategories
        .map((cat, i) => ({ ...cat, originalIndex: i }))
        .filter((cat) => cat.name.includes(searchTerm));
    } else {
      return jobCategories
        .map((cat, i) => ({
          ...cat,
          originalIndex: i,
          subCategories: cat.subCategories.filter((sub) =>
            sub.name.includes(searchTerm)
          ),
        }))
        .filter((cat) => cat.subCategories.length > 0);
    }
  };

  const filteredCategories = getFilteredCategories();

  const searchPlaceholder =
    searchMode === "category"
      ? "جستجو گروه‌های شغلی..."
      : "جستجو دسته‌های شغلی...";

  return (
    <div className="space-y-3">
      <div className="bg-[var(--color-list-backgnd2)] rounded-md border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => {
            setExpandedCategory(null);
            onSelectSubCategory(null, null);
          }}
          className={`w-full flex items-center justify-between px-4 py-2.5 transition-all duration-200 border-b border-gray-100 cursor-pointer group text-right ${selectedCategoryIndex === null
            ? "bg-list-title-bej3 text-gray-900 border-r-3 border-r-gray-500 font-bold"
            : "bg-list-title-bej2 text-gray-700 hover:bg-list-title-bej1 hover:text-gray-900 border-r-3 border-r-transparent"
            }`}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">
              همه گروه‌های شغلی
            </h3>
          </div>
        </button>

        {/* Search */}
        <div className="px-3 py-1.5 border-b border-gray-50 bg-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
            />
          </div>
        </div>

        {/* Category List */}
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <>

              {filteredCategories.map((category) => {
                const isExpanded = expandedCategory === category.originalIndex;
                const isSelected = selectedCategoryIndex === category.originalIndex;

                return (
                  <div key={category.originalIndex}>
                    {/* Category Item */}
                    <button
                      onClick={() => handleCategoryClick(category.originalIndex)}
                      className={`w-full flex items-center justify-between px-4 py-1.5 text-sm font-medium transition-all duration-200 border-b border-gray-50 ${isSelected
                        ? "bg-list-title-bej3 text-primary border-r-3 border-r-primary"
                        : "text-gray-700 hover:bg-list-title hover:text-gray-900"
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-xs md:text-sm">{category.name}</span>
                      </span>
                      {category.subCategories.length > 0 && (
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 text-gray-400 ${isExpanded ? "rotate-180" : ""
                            }`}
                        />
                      )}
                    </button>

                    {/* SubCategories */}
                    {isExpanded && category.subCategories.length > 0 && (
                      <div className="bg-gray-50/50 animate-fade-in">
                        {category.subCategories.map((sub) => {
                          const isSubSelected =
                            selectedSubCategorySlug === sub.slug;
                          return (
                            <button
                              key={sub.slug}
                              onClick={() =>
                                handleSubCategoryClick(
                                  category.originalIndex,
                                  sub.slug
                                )
                              }
                              className={`w-full flex items-center gap-2 px-8 py-2 text-xs transition-all duration-150 ${isSubSelected
                                ? "bg-list-title text-gray-900 font-semibold"
                                : "text-gray-600 hover:bg-gray-100 hover:font-bold"
                                }`}
                            >
                              {/* <ChevronLeft size={12} /> */}
                              {sub.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

      </div>
      {/* Global Jobs/Ads Search - only visible on desktop (lg) */}
      <div className="hidden lg:block p-2 bg-[var(--color-list-backgnd2)] rounded-md border border-gray-100 shadow-sm">
        <form onSubmit={handleGlobalSearchSubmit} className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="جستجوی مشاغل و آگهی‌ها..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400 transition-all text-right"
          />
        </form>
      </div>
    </div>
  );
}
