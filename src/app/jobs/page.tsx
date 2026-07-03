"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CategorySidebar from "@/components/CategorySidebar";
import JobCard, { JobCardData } from "@/components/JobCard";
import AdCard, { AdCardData } from "@/components/AdCard";
import { useCityStore } from "@/store/cityStore";
import { useCategories } from "@/hooks/useCategories";
import { ChevronLeft, Filter, SlidersHorizontal, X, Loader2, Search } from "lucide-react";
import { timeAgo } from "@/lib/utils";



function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedCity, openCityModal } = useCityStore();
  const { categories: jobCategories, isLoading: isCategoriesLoading } = useCategories();

  const categoryParam = searchParams.get("category");
  const searchQuery = searchParams.get("q") || "";
  const parsedCategory = categoryParam ? parseInt(categoryParam, 10) : null;
  const initialCategoryIndex = 
    parsedCategory !== null && !isNaN(parsedCategory) && parsedCategory >= 0 && parsedCategory < jobCategories.length 
      ? parsedCategory 
      : null;
      
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(initialCategoryIndex);
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState<string | null>(null);
  const [activeAdTab, setActiveAdTab] = useState<"commercial" | "employment" | "job_seeker">("commercial");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [jobsData, setJobsData] = useState<any[]>([]);
  const [adsData, setAdsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const qParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
    Promise.all([
      fetch(`/api/jobs${qParam}`).then(res => res.json()),
      fetch(`/api/ads${qParam}`).then(res => res.json())
    ]).then(([jobsRes, adsRes]) => {
      if(Array.isArray(jobsRes)) setJobsData(jobsRes);
      if(Array.isArray(adsRes)) setAdsData(adsRes);
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedCity) {
      const timer = setTimeout(() => {
        // Double check after hydration using getState
        const currentCity = useCityStore.getState().selectedCity;
        if (!currentCity) {
          openCityModal();
        }
      }, 500); // Small delay to allow hydration
      return () => clearTimeout(timer);
    }
  }, [selectedCity, openCityModal]);

  useEffect(() => {
    const parsedCategory = categoryParam ? parseInt(categoryParam, 10) : null;
    const initialCategoryIndex = 
      parsedCategory !== null && !isNaN(parsedCategory) && parsedCategory >= 0 && parsedCategory < jobCategories.length 
        ? parsedCategory 
        : null;
    setSelectedCategoryIndex(initialCategoryIndex);
  }, [categoryParam]);

  const selectedCategory = selectedCategoryIndex !== null ? jobCategories[selectedCategoryIndex] : null;
  const selectedSubCategory = selectedCategory?.subCategories.find(sub => sub.slug === selectedSubCategorySlug) || null;

  const handleJobClick = (id: number) => {
    router.push(`/job/${id}`);
  };

  const filteredJobs = jobsData.map(job => {
    const reviews = job.reviews || [];
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0 
      ? Math.round(reviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / reviewCount) 
      : 5; // Default to 5 if no reviews

    return {
      id: job.id,
      title: job.title,
      category: job.category?.name || "",
      subCategory: job.subCategory?.name || "",
      rating: avgRating,
      reviewCount: reviewCount,
      viewCount: job.viewCount || 0,
      city: job.city?.name || "",
      timeAgo: timeAgo(job.createdAt),
      isVip: job.isVip,
    };
  }).filter((job) => {
    const categoryMatches = selectedCategory ? job.category === selectedCategory.name : true;
    const subCategoryMatches = selectedSubCategory ? job.subCategory === selectedSubCategory.name : true;
    const cityMatches = selectedCity ? job.city === selectedCity.name : true;
    return categoryMatches && subCategoryMatches && cityMatches;
  });

  const getAdTypeKey = (typeStr: string): "commercial" | "employment" | "job_seeker" => {
    switch(typeStr) {
      case 'EMPLOYMENT': return 'employment';
      case 'JOB_SEEKER': return 'job_seeker';
      case 'COMMERCIAL': return 'commercial';
      default: return 'commercial';
    }
  };

  const filteredAds = adsData.map(ad => ({
    id: ad.id,
    title: ad.title,
    description: ad.description || "",
    category: ad.category?.name || "",
    subCategory: ad.subCategory?.name || "",
    type: getAdTypeKey(ad.type),
    city: ad.city?.name || "",
    timeAgo: timeAgo(ad.createdAt),
  })).filter((ad) => {
    const typeMatches = ad.type === activeAdTab;
    const categoryMatches = selectedCategory ? ad.category === selectedCategory.name : true;
    const subCategoryMatches = selectedSubCategory ? ad.subCategory === selectedSubCategory.name : true;
    const cityMatches = selectedCity ? ad.city === selectedCity.name : true;
    return typeMatches && categoryMatches && subCategoryMatches && cityMatches;
  });

  const adTabs = [
    { key: "commercial" as const, label: "آگهی‌های تجاری" },
    { key: "employment" as const, label: "آگهی‌های استخدام" },
    { key: "job_seeker" as const, label: "آگهی‌های جویای کار" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <a href="/" className="hover:text-primary transition-colors">خانه</a>
          <ChevronLeft size={12} />
          <span className="text-gray-700 font-medium">مشاهده مشاغل و آگهی‌ها</span>
          {selectedCity && (
            <>
              <ChevronLeft size={12} />
              <span className="text-primary font-medium">{selectedCity.name}</span>
            </>
          )}
        </div>

        {/* Search Results Banner */}
        {searchQuery && (
          <div className="flex items-center justify-between bg-white rounded-xl border border-primary/20 px-4 py-3 mb-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Search size={16} className="text-primary" />
              <span>نتایج جستجو برای: <strong className="text-primary">«{searchQuery}»</strong></span>
            </div>
            <button
              onClick={() => router.push('/jobs')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              <X size={14} />
              پاک کردن
            </button>
          </div>
        )}

        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal size={16} />
          فیلتر گروه‌های شغلی
        </button>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <CategorySidebar
                selectedCategoryIndex={selectedCategoryIndex}
                selectedSubCategorySlug={selectedSubCategorySlug}
                onSelectCategory={(i) => {
                  setSelectedCategoryIndex(i);
                  setSelectedSubCategorySlug(null);
                }}
                onSelectSubCategory={(catIdx, subSlug) => {
                  setSelectedCategoryIndex(catIdx);
                  setSelectedSubCategorySlug(subSlug);
                }}
              />
            </div>
          </aside>

          {/* Mobile Sidebar Overlay */}
          {showMobileSidebar && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowMobileSidebar(false)}
              />
              <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl animate-slide-right overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">گروه‌های شغلی</h3>
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <CategorySidebar
                  selectedCategoryIndex={selectedCategoryIndex}
                  selectedSubCategorySlug={selectedSubCategorySlug}
                  onSelectCategory={(i) => {
                    setSelectedCategoryIndex(i);
                    setSelectedSubCategorySlug(null);
                  }}
                  onSelectSubCategory={(catIdx, subSlug) => {
                    setSelectedCategoryIndex(catIdx);
                    setSelectedSubCategorySlug(subSlug);
                    setShowMobileSidebar(false);
                  }}
                />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Jobs Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-xl">{selectedCategory?.icon || "📁"}</span>
                  مشاغل {selectedCategory?.name || "همه گروه‌ها"}
                  {selectedCity && (
                    <span className="text-xs text-gray-400 font-normal">
                      در {selectedCity.name}
                    </span>
                  )}
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 min-h-[200px]">
                {isLoading ? (
                  <div className="col-span-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} onClick={handleJobClick} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-10 text-gray-400 text-sm">
                    شغلی در این دسته یافت نشد
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <button className="px-6 py-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors">
                  نمایش بیشتر
                </button>
              </div>
            </section>

            {/* Ads Section */}
            <section>
              {/* Tab Headers */}
              <div className="flex items-center gap-1 bg-white rounded-t-2xl border border-gray-100 border-b-0 p-1">
                {adTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveAdTab(tab.key)}
                    className={`flex-1 py-2.5 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeAdTab === tab.key
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-500 hover:text-primary hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-b-2xl border border-gray-100 border-t-0 p-3 md:p-4">
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 animate-fade-in min-h-[200px]">
                  {isLoading ? (
                    <div className="col-span-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  ) : filteredAds.length > 0 ? (
                    filteredAds.map((ad) => (
                      <AdCard key={ad.id} ad={ad} onClick={() => router.push(`/ad/${ad.id}`)} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-10 text-gray-400 text-sm">
                      آگهی‌ای در این دسته یافت نشد
                    </div>
                  )}
                </div>

                {filteredAds.length > 0 && (
                  <div className="mt-4 text-center">
                    <button className="px-6 py-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors">
                      نمایش آگهی‌های بیشتر
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">در حال بارگذاری...</div>}>
      <JobsContent />
    </Suspense>
  );
}
