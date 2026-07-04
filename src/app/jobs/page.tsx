"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CategorySidebar from "@/components/CategorySidebar";
import JobCard, { JobCardData } from "@/components/JobCard";
import AdCard, { AdCardData } from "@/components/AdCard";
import { useCityStore } from "@/store/cityStore";
import { useCategories } from "@/hooks/useCategories";
import { ChevronLeft, Filter, SlidersHorizontal, X, Loader2, Search } from "lucide-react";
import { timeAgo } from "@/lib/utils";

const INITIAL_LOAD = 12; // Fill ~1 page
const SCROLL_BATCH = 6; // Items per lazy-load batch
const PAUSE_AT = 30; // Show "load more" button after this many

const getAdTypeKey = (typeStr: string): "commercial" | "employment" | "job_seeker" => {
  switch (typeStr) {
    case 'EMPLOYMENT': return 'employment';
    case 'JOB_SEEKER': return 'job_seeker';
    case 'COMMERCIAL': return 'commercial';
    case 'COMMERCIAL_FREE': return 'commercial';
    default: return 'commercial';
  }
};

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

  // Jobs pagination state
  const [jobsData, setJobsData] = useState<any[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsHasMore, setJobsHasMore] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [loadMoreClicked, setLoadMoreClicked] = useState(false);

  // Ads state (kept simple, no pagination)
  const [adsData, setAdsData] = useState<any[]>([]);
  const [isLoadingAds, setIsLoadingAds] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const selectedCategory = selectedCategoryIndex !== null ? jobCategories[selectedCategoryIndex] : null;
  const selectedSubCategory = selectedCategory?.subCategories.find(sub => sub.slug === selectedSubCategorySlug) || null;

  // Fetch jobs with pagination
  const fetchJobs = useCallback(async (skip: number, take: number, reset = false) => {
    let url = `/api/jobs?take=${take}&skip=${skip}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (selectedCity?.id) url += `&cityId=${selectedCity.id}`;
    if (selectedCategory?.id) url += `&categoryId=${selectedCategory.id}`;
    if (selectedSubCategory?.id) url += `&subCategoryId=${selectedSubCategory.id}`;

    const res = await fetch(url);
    const data = await res.json();
    if (data.jobs) {
      setJobsData(prev => {
        if (reset) return data.jobs;
        const newJobs = data.jobs.filter((newJob: any) => !prev.some((oldJob) => oldJob.id === newJob.id));
        return [...prev, ...newJobs];
      });
      setJobsTotal(data.total);
      setJobsHasMore(data.hasMore);
    }
  }, [searchQuery, selectedCity?.id, selectedCategory?.id, selectedSubCategory?.id]);

  // Initial load
  useEffect(() => {
    setIsLoadingJobs(true);
    setJobsData([]);
    setAutoScrollEnabled(true);
    setLoadMoreClicked(false);
    fetchJobs(0, INITIAL_LOAD, true).finally(() => setIsLoadingJobs(false));
  }, [searchQuery, fetchJobs]);

  // Load ads (no pagination)
  useEffect(() => {
    setIsLoadingAds(true);
    let url = `/api/ads?`;
    if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
    if (selectedCity?.id) url += `cityId=${selectedCity.id}&`;
    if (selectedCategory?.id) url += `categoryId=${selectedCategory.id}&`;
    if (selectedSubCategory?.id) url += `subCategoryId=${selectedSubCategory.id}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAdsData(data);
          // Auto-switch to a tab that has results if current tab is empty
          if (data.length > 0) {
            setActiveAdTab((prevTab) => {
              const hasCurrentTabAds = data.some((ad: any) => getAdTypeKey(ad.type) === prevTab);
              if (!hasCurrentTabAds) {
                return getAdTypeKey(data[0].type);
              }
              return prevTab;
            });
          }
        }
        setIsLoadingAds(false);
      })
      .catch(() => setIsLoadingAds(false));
  }, [searchQuery, selectedCity?.id, selectedCategory?.id, selectedSubCategory?.id]);

  useEffect(() => {
    if (!selectedCity) {
      const timer = setTimeout(() => {
        const currentCity = useCityStore.getState().selectedCity;
        if (!currentCity) {
          openCityModal();
        }
      }, 500);
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

  // Load more jobs handler
  const loadMoreJobs = useCallback(async () => {
    if (isLoadingMore || !jobsHasMore) return;
    setIsLoadingMore(true);
    await fetchJobs(jobsData.length, SCROLL_BATCH);
    setIsLoadingMore(false);
  }, [isLoadingMore, jobsHasMore, jobsData.length, fetchJobs]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!autoScrollEnabled || !jobsHasMore || isLoadingJobs) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          // Pause auto-scroll after PAUSE_AT items (only on first pass)
          if (jobsData.length >= PAUSE_AT && !loadMoreClicked) {
            setAutoScrollEnabled(false);
            return;
          }
          loadMoreJobs();
        }
      },
      { rootMargin: "200px" }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [autoScrollEnabled, jobsHasMore, isLoadingJobs, isLoadingMore, jobsData.length, loadMoreClicked, loadMoreJobs]);

  // (Moved selectedCategory and selectedSubCategory to the top)

  const handleJobClick = (id: number) => {
    router.push(`/job/${id}`);
  };

  // Format data (filtering is now done entirely on the server)
  const filteredJobs = jobsData.map(job => {
    const reviews = job.reviews || [];
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? Math.round(reviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / reviewCount)
      : 5;

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
  });

  // (getAdTypeKey moved outside component)

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
    return ad.type === activeAdTab; // City and category filtering is already done on the server
  });

  const adTabs = [
    { key: "commercial" as const, label: "آگهی‌های تجاری" },
    { key: "employment" as const, label: "آگهی‌های استخدام" },
    { key: "job_seeker" as const, label: "آگهی‌های جویای کار" },
  ];

  // Should we show the "Load More" button?
  const showLoadMoreButton = !autoScrollEnabled && jobsHasMore && !loadMoreClicked;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">


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
            <div className="sticky top-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 min-h-[100px]">
                {isLoadingJobs ? (
                  <div className="col-span-full flex items-center justify-center py-20">
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

              {/* Loading more spinner */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              )}

              {/* Intersection Observer sentinel for auto-scroll */}
              {autoScrollEnabled && jobsHasMore && !isLoadingJobs && (
                <div ref={sentinelRef} className="h-1" />
              )}

              {/* Load More button - appears after PAUSE_AT items */}
              {showLoadMoreButton && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setLoadMoreClicked(true);
                      setAutoScrollEnabled(true);
                      loadMoreJobs();
                    }}
                    className="px-6 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    نمایش بیشتر ({jobsTotal - jobsData.length} مورد دیگر)
                  </button>
                </div>
              )}
            </section>

            {/* Ads Section */}
            <section>
              {/* Tab Headers */}
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 border-t-0 border-b-0">
                {adTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveAdTab(tab.key)}
                    className={`flex-1 py-2.5 text-xs md:text-sm font-medium rounded-t-md transition-all duration-100 ${activeAdTab === tab.key
                      ? "bg-white text-primary border-t-1 border-primary"
                      : "text-gray-500 bg-gray-100 hover:text-primary hover:bg-gray-50"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 p-3 md:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 animate-fade-in min-h-[100px]">
                  {isLoadingAds ? (
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
                    <button className="px-6 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-primary/10 rounded-xl transition-colors">
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
