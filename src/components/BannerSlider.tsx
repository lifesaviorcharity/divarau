"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BannerSlide {
  id: number;
  imageUrl: string;
  link?: string;
}

interface BannerSliderProps {
  banners?: BannerSlide[];
  autoPlayInterval?: number; // seconds
}

const BannerImage = ({ src, alt, className, fallback }: { src?: string, alt: string, className?: string, fallback: React.ReactNode }) => {
  const [error, setError] = useState(false);
  if (!src || src.trim() === "" || error) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
};

function SquareSlider({ banners, autoPlayInterval = 5 }: { banners: BannerSlide[], autoPlayInterval?: number }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 800);
    },
    [isTransitioning]
  );

  const nextSlide = useCallback(() => {
    if (banners.length <= 1) return;
    goToSlide((currentSlide + 1) % banners.length);
  }, [currentSlide, banners.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (banners.length <= 1) return;
    goToSlide(currentSlide === 0 ? banners.length - 1 : currentSlide - 1);
  }, [currentSlide, banners.length, goToSlide]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(nextSlide, autoPlayInterval * 1000);
    return () => clearInterval(interval);
  }, [nextSlide, autoPlayInterval, banners.length]);

  const EmptyPlaceholder = () => (
    <div className="relative w-full h-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex flex-col items-center justify-center shadow-sm border-2 border-dashed border-gray-200">
      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <p className="text-gray-400 text-sm font-bold">محل آگهی شما</p>
      <p className="text-gray-300 text-[10px] mt-1">Your Ad Here</p>
    </div>
  );

  if (!banners || banners.length === 0) {
    return <EmptyPlaceholder />;
  }

  return (
    <div className="relative w-full aspect-square overflow-hidden rounded-2xl shadow-lg group bg-white">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide
              ? "opacity-100 scale-100 z-10"
              : "opacity-0 scale-105 z-0"
          }`}
        >
          {banner.link ? (
            <a href={banner.link} className="block w-full h-full relative group" target="_blank" rel="noopener noreferrer">
              <BannerImage
                src={banner.imageUrl}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                fallback={<EmptyPlaceholder />}
              />
            </a>
          ) : (
            <div className="relative w-full h-full">
              <BannerImage
                src={banner.imageUrl}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover"
                fallback={<EmptyPlaceholder />}
              />
            </div>
          )}
        </div>
      ))}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center text-gray-700 hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
            aria-label="بنر قبلی"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center text-gray-700 hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
            aria-label="بنر بعدی"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === currentSlide
                  ? "w-4 h-1.5 bg-white shadow-md"
                  : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`برو به بنر ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BannerSlider({
  autoPlayInterval = 5,
}: BannerSliderProps) {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/banners")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBanners(data);
        } else {
          console.error("Invalid banner data", data);
          setBanners([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch banners", err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div className="w-full aspect-square md:aspect-[3/1] bg-gray-100 rounded-2xl animate-pulse"></div>;
  if (!Array.isArray(banners)) return null;

  // Desktop splits based on math formula:
  // Banner1: indexes 0, 3, 6... (i % 3 === 0)
  // Banner2: indexes 1, 4, 7... (i % 3 === 1)
  // Banner3: indexes 2, 5, 8... (i % 3 === 2)
  const banner1 = banners.filter((_, i) => i % 3 === 0);
  const banner2 = banners.filter((_, i) => i % 3 === 1);
  const banner3 = banners.filter((_, i) => i % 3 === 2);

  return (
    <div className="w-full">
      {/* Mobile View: Single 1x1 slider with all banners */}
      <div className="block md:hidden">
        <SquareSlider banners={banners} autoPlayInterval={autoPlayInterval} />
      </div>

      {/* Desktop View: Grid of 3 square sliders */}
      <div className="hidden md:grid grid-cols-3 gap-4 lg:gap-6">
        <SquareSlider banners={banner1} autoPlayInterval={autoPlayInterval} />
        <SquareSlider banners={banner2} autoPlayInterval={autoPlayInterval} />
        <SquareSlider banners={banner3} autoPlayInterval={autoPlayInterval} />
      </div>
    </div>
  );
}
