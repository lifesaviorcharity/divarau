"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Search, ChevronDown, ChevronLeft, Loader2 } from "lucide-react";

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
  const { categories: jobCategories, isLoading } = useCategories();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(
    selectedCategoryIndex
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"category" | "subcategory">(
    "category"
  );

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
      ? "جستجو در گروه‌های شغلی..."
      : "جستجو در دسته‌های شغلی...";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-l from-primary/5 to-transparent border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">فهرست گروه‌های شغلی</h3>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-gray-50">
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
            className="w-full pr-9 pl-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Category List */}
      <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : (
          <>
            {/* All Categories Item */}
            <button
              onClick={() => {
                setExpandedCategory(null);
                onSelectCategory(null);
                onSelectSubCategory(null, null);
              }}
          className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold transition-all duration-200 border-b border-gray-50 ${
            selectedCategoryIndex === null
              ? "bg-primary/5 text-primary border-r-3 border-r-primary"
              : "text-gray-700 hover:bg-gray-50 hover:text-primary"
          }`}
        >
          <span className="text-lg">📁</span>
          <span>همه گروه‌های شغلی</span>
        </button>

        {filteredCategories.map((category) => {
          const isExpanded = expandedCategory === category.originalIndex;
          const isSelected = selectedCategoryIndex === category.originalIndex;

          return (
            <div key={category.originalIndex}>
              {/* Category Item */}
              <button
                onClick={() => handleCategoryClick(category.originalIndex)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b border-gray-50 ${
                  isSelected
                    ? "bg-primary/5 text-primary border-r-3 border-r-primary"
                    : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-xs md:text-sm">{category.name}</span>
                </span>
                {category.subCategories.length > 0 && (
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 text-gray-400 ${
                      isExpanded ? "rotate-180" : ""
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
                        className={`w-full flex items-center gap-2 px-8 py-2 text-xs transition-all duration-150 ${
                          isSubSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-gray-600 hover:bg-gray-100 hover:text-primary"
                        }`}
                      >
                        <ChevronLeft size={12} />
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
  );
}
