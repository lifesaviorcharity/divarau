"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
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
  const subCategoryParam = searchParams.get("sub");

  const selectedCategoryIndex = useMemo(() => {
    if (!categoryParam || jobCategories.length === 0) return null;
    const num = parseInt(categoryParam, 10);
    if (!isNaN(num)) {
      // Check if it matches a category ID directly
      const byId = jobCategories.findIndex((c) => c.id === num);
      if (byId !== -1) return byId;
      // Or if it was a valid index
      if (num >= 0 && num < jobCategories.length) return num;
    }
    // Check by slug or name
    const bySlug = jobCategories.findIndex(
      (c) => (c as any).slug === categoryParam || c.name === categoryParam
    );
    if (bySlug !== -1) return bySlug;
    return null;
  }, [categoryParam, jobCategories]);

  const selectedSubCategorySlug = subCategoryParam;
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
  const selectedSubCategory = useMemo(() => {
    if (!selectedCategory || !selectedSubCategorySlug) return null;
    const num = parseInt(selectedSubCategorySlug, 10);
    return (
      selectedCategory.subCategories.find(
        (sub) =>
          sub.slug === selectedSubCategorySlug ||
          sub.name === selectedSubCategorySlug ||
          (!isNaN(num) && sub.id === num)
      ) || null
    );
  }, [selectedCategory, selectedSubCategorySlug]);

  // Fetch jobs with pagination
  const fetchJobs = useCallback(async (skip: number, take: number, reset = false) => {
    let url = `/api/jobs?take=${take}&skip=${skip}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (selectedCity?.id) url += `&cityId=${selectedCity.id}`;

    const catVal = selectedCategory?.id || (categoryParam ? parseInt(categoryParam, 10) || categoryParam : undefined);
    const subVal = selectedSubCategory?.id || subCategoryParam;

    if (catVal) url += `&category=${encodeURIComponent(catVal)}`;
    if (subVal) url += `&sub=${encodeURIComponent(subVal)}`;

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
  }, [searchQuery, selectedCity?.id, selectedCategory?.id, selectedSubCategory?.id, categoryParam, subCategoryParam]);

  // Check if we need to restore category from localStorage before fetching
  const isRestoringFromStorage = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hasCat = searchParams.has("category");
    const hasSub = searchParams.has("sub");
    const hasQ = searchParams.has("q");
    if (!hasCat && !hasSub && !hasQ) {
      const savedCat = localStorage.getItem("last_selected_category");
      return !!savedCat;
    }
    return false;
  }, [searchParams]);

  // Initial load
  useEffect(() => {
    // If returning to /jobs without params but localStorage has saved category, wait for router.replace to restore params
    if (isRestoringFromStorage) return;

    setIsLoadingJobs(true);
    setJobsData([]);
    setAutoScrollEnabled(true);
    setLoadMoreClicked(false);
    fetchJobs(0, INITIAL_LOAD, true).finally(() => setIsLoadingJobs(false));
  }, [searchQuery, categoryParam, subCategoryParam, selectedCity?.id, isRestoringFromStorage, fetchJobs]);

  // Load ads
  useEffect(() => {
    // If returning to /jobs without params but localStorage has saved category, wait for router.replace to restore params
    if (isRestoringFromStorage) return;

    setIsLoadingAds(true);
    let url = `/api/ads?`;
    if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
    if (selectedCity?.id) url += `cityId=${selectedCity.id}&`;

    const catVal = selectedCategory?.id || (categoryParam ? parseInt(categoryParam, 10) || categoryParam : undefined);
    const subVal = selectedSubCategory?.id || subCategoryParam;

    if (catVal) url += `category=${encodeURIComponent(catVal)}&`;
    if (subVal) url += `sub=${encodeURIComponent(subVal)}&`;

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
  }, [searchQuery, categoryParam, subCategoryParam, selectedCity?.id, selectedCategory?.id, selectedSubCategory?.id, isRestoringFromStorage]);

  // Persistent category/subcategory memory (localStorage)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasCatInUrl = searchParams.has("category");
    const hasSubInUrl = searchParams.has("sub");
    const hasQInUrl = searchParams.has("q");

    if (!hasCatInUrl && !hasSubInUrl && !hasQInUrl) {
      // User arrived at /jobs from another page without query params: restore last saved selection if present
      const savedCategory = localStorage.getItem("last_selected_category");
      const savedSub = localStorage.getItem("last_selected_sub");

      if (savedCategory) {
        const params = new URLSearchParams();
        params.set("category", savedCategory);
        if (savedSub) params.set("sub", savedSub);
        router.replace(`/jobs?${params.toString()}`, { scroll: false });
      }
    } else if (hasCatInUrl || hasSubInUrl) {
      // URL has category/sub query params: keep localStorage in sync
      if (categoryParam !== null) {
        localStorage.setItem("last_selected_category", categoryParam.toString());
      } else {
        localStorage.removeItem("last_selected_category");
      }

      if (subCategoryParam !== null) {
        localStorage.setItem("last_selected_sub", subCategoryParam);
      } else {
        localStorage.removeItem("last_selected_sub");
      }
    }
  }, [searchParams, categoryParam, subCategoryParam, router]);

  const handleCategorySelect = useCallback((i: number | null) => {
    if (typeof window !== "undefined") {
      if (i !== null && jobCategories[i]) {
        localStorage.setItem("last_selected_category", String(jobCategories[i].id));
      } else {
        localStorage.removeItem("last_selected_category");
      }
      localStorage.removeItem("last_selected_sub");
    }
    const params = new URLSearchParams(searchParams.toString());
    if (i !== null && jobCategories[i]) {
      params.set("category", String(jobCategories[i].id));
    } else {
      params.delete("category");
    }
    params.delete("sub");
    router.push(`/jobs?${params.toString()}`, { scroll: false });
  }, [searchParams, jobCategories, router]);

  const handleSubCategorySelect = useCallback((catIdx: number | null, subSlug: string | null) => {
    if (typeof window !== "undefined") {
      if (catIdx !== null && jobCategories[catIdx]) {
        localStorage.setItem("last_selected_category", String(jobCategories[catIdx].id));
      } else {
        localStorage.removeItem("last_selected_category");
      }
      if (subSlug !== null) {
        localStorage.setItem("last_selected_sub", subSlug);
      } else {
        localStorage.removeItem("last_selected_sub");
      }
    }
    const params = new URLSearchParams(searchParams.toString());
    if (catIdx !== null && jobCategories[catIdx]) {
      params.set("category", String(jobCategories[catIdx].id));
    } else {
      params.delete("category");
    }
    if (subSlug !== null) {
      params.set("sub", subSlug);
    } else {
      params.delete("sub");
    }
    router.push(`/jobs?${params.toString()}`, { scroll: false });
  }, [searchParams, jobCategories, router]);



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
      : 0;

    return {
      id: job.id,
      title: job.title,
      category: job.category?.name || "",
      subCategory: job.subCategory?.name || "",
      imageUrl: job.images?.find((img: any) => img.isMain)?.url || job.images?.[0]?.url || "",
      rating: avgRating,
      reviewCount: reviewCount,
      viewCount: job.viewCount || 0,
      city: job.city?.name || "",
      timeAgo: timeAgo(job.createdAt),
      isVip: job.isVip,
      isBoosted: job.isBoosted,
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
              <Search size={16} className="text-primary flex-shrink-0" />
              <span>
                نتایج جستجو برای: <strong className="text-primary">«{searchQuery}»</strong>
                {selectedCategory ? (
                  <span className="text-xs text-gray-500 mr-2">
                    (محدود به دسته‌بندی: <strong className="text-gray-700">{selectedCategory.name}</strong>
                    {selectedSubCategory ? ` > ${selectedSubCategory.name}` : ""})
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 mr-2">
                    (در تمامی دسته‌های شغلی)
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("q");
                const qs = params.toString();
                router.push(qs ? `/jobs?${qs}` : "/jobs", { scroll: false });
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
            >
              <X size={14} />
              پاک کردن جستجو
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
                onSelectCategory={handleCategorySelect}
                onSelectSubCategory={handleSubCategorySelect}
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
                    handleCategorySelect(i);
                    setShowMobileSidebar(false);
                  }}
                  onSelectSubCategory={(catIdx, subSlug) => {
                    handleSubCategorySelect(catIdx, subSlug);
                    setShowMobileSidebar(false);
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col space-y-6 min-h-[calc(100vh-130px)]">
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
                    {selectedCategory && !selectedSubCategory
                      ? "شغل ویژه‌ای در گروه اصلی این دسته ثبت نشده است. برای مشاهده تمام مشاغل، لطفاً یکی از زیردسته‌ها را انتخاب نمایید."
                      : "شغلی در این دسته یافت نشد"}
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
            <section className="mt-auto">
              {/* Tab Headers */}
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 border-t-0 border-b-0">
                {adTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveAdTab(tab.key)}
                    className={`flex-1 py-2.5 text-xs md:text-sm font-medium rounded-t-md transition-all duration-100 ${activeAdTab === tab.key
                      ? "bg-white border-t-1 border-primary"
                      : "text-gray-500 bg-gray-100 hover:font-bold hover:bg-gray-50"
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
