"use client";

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Search, ChevronDown, Loader2 } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<number | null>(selectedCategoryIndex);

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
      router.push("/jobs");
    }
  };

  const handleCategoryClick = (originalIndex: number) => {
    if (expandedCategory === originalIndex) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(originalIndex);
    }
    onSelectCategory(originalIndex);
  };

  const handleSubCategoryClick = (categoryIndex: number, subSlug: string) => {
    onSelectSubCategory(categoryIndex, subSlug);
  };

  // Process categories and subcategories with top-to-bottom search
  const cleanTerm = searchTerm.trim().toLowerCase();

  const processedCategories = jobCategories.map((cat, origIdx) => {
    const catMatch = cleanTerm !== "" && cat.name.toLowerCase().includes(cleanTerm);
    const matchingSubSlugs = new Set(
      cat.subCategories
        .filter((sub) => cleanTerm !== "" && sub.name.toLowerCase().includes(cleanTerm))
        .map((sub) => sub.slug)
    );

    const hasMatch = catMatch || matchingSubSlugs.size > 0;

    return {
      ...cat,
      originalIndex: origIdx,
      catMatch,
      matchingSubSlugs,
      hasMatch,
    };
  });

  const displayCategories = cleanTerm !== ""
    ? processedCategories.filter((c) => c.hasMatch)
    : processedCategories;

  // Find the FIRST match in order from top to bottom
  let firstMatch: { type: "cat" | "sub"; catIndex: number; subSlug?: string } | null = null;

  if (cleanTerm !== "") {
    for (const cat of processedCategories) {
      if (!cat.hasMatch) continue;

      // Check category name first
      if (cat.catMatch) {
        firstMatch = { type: "cat", catIndex: cat.originalIndex };
        break;
      }

      // Check subcategories of this category
      let foundSub = false;
      for (const sub of cat.subCategories) {
        if (cat.matchingSubSlugs.has(sub.slug)) {
          firstMatch = { type: "sub", catIndex: cat.originalIndex, subSlug: sub.slug };
          foundSub = true;
          break;
        }
      }
      if (foundSub) break;
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-[var(--color-list-backgnd2)] rounded-md border border-gray-100 shadow-sm overflow-hidden">
        {/* All Categories Button */}
        <button
          onClick={() => {
            setExpandedCategory(null);
            onSelectSubCategory(null, null);
          }}
          className={`w-full flex items-center justify-between px-4 py-2.5 transition-all duration-200 border-b border-gray-100 cursor-pointer group text-right ${
            selectedCategoryIndex === null
              ? "bg-list-title-bej3 text-gray-900 border-r-3 border-r-gray-500 font-bold"
              : "bg-list-title-bej2 text-gray-700 hover:bg-list-title-bej1 hover:text-gray-900 border-r-3 border-r-transparent"
          }`}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">همه گروه‌های شغلی</h3>
          </div>
        </button>

        {/* Search Bar */}
        <div className="px-3 py-1.5 border-b border-gray-50 bg-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="جستجوی گروه یا دسته شغلی..."
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
              {displayCategories.map((category) => {
                const isSearching = cleanTerm !== "";
                const isExpanded =
                  expandedCategory === category.originalIndex ||
                  (isSearching && category.matchingSubSlugs.size > 0);

                const isSelected = selectedCategoryIndex === category.originalIndex;
                const isCatFirstMatch =
                  firstMatch?.type === "cat" &&
                  firstMatch?.catIndex === category.originalIndex;

                return (
                  <div key={category.originalIndex}>
                    {/* Category Item */}
                    <button
                      onClick={() => handleCategoryClick(category.originalIndex)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-all duration-200 border-b border-gray-50 ${
                        isCatFirstMatch
                          ? "bg-amber-100/90 text-amber-900 font-bold border-r-4 border-r-amber-500 ring-1 ring-amber-300"
                          : isSelected
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
                          const isSubSelected = selectedSubCategorySlug === sub.slug;
                          const isSubMatch = category.matchingSubSlugs.has(sub.slug);

                          const isSubFirstMatch =
                            firstMatch?.type === "sub" &&
                            firstMatch?.catIndex === category.originalIndex &&
                            firstMatch?.subSlug === sub.slug;

                          // Show subcategory if not searching OR if searching and subcategory matches or category matches
                          if (isSearching && !isSubMatch && !category.catMatch) {
                            return null;
                          }

                          return (
                            <button
                              key={sub.slug}
                              onClick={() =>
                                handleSubCategoryClick(category.originalIndex, sub.slug)
                              }
                              className={`w-full flex items-center justify-between px-8 py-2 text-xs transition-all duration-150 ${
                                isSubFirstMatch
                                  ? "bg-amber-100/90 text-amber-900 font-bold ring-1 ring-amber-400/60"
                                  : isSubSelected
                                  ? "bg-list-title text-gray-900 font-semibold"
                                  : isSubMatch
                                  ? "bg-amber-50/60 text-amber-900 font-medium"
                                  : "text-gray-600 hover:bg-gray-100 hover:font-bold"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span>{sub.name}</span>
                              </span>
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
