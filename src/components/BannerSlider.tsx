"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BannerSlide {
  id: number;
  imageUrl: string;
  link?: string;
}

// Demo banners - will be replaced with data from DB
const demoBanners: BannerSlide[] = [
  {
    id: 1,
    imageUrl: "/banners/banner1.jpg",
    link: "#",
  },
  {
    id: 2,
    imageUrl: "/banners/banner2.jpg",
    link: "#",
  },
  {
    id: 3,
    imageUrl: "/banners/banner3.jpg",
    link: "#",
  },
];

interface BannerSliderProps {
  banners?: BannerSlide[];
  autoPlayInterval?: number; // seconds
}

export default function BannerSlider({
  autoPlayInterval = 5,
}: BannerSliderProps) {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
    goToSlide((currentSlide + 1) % banners.length);
  }, [currentSlide, banners.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide === 0 ? banners.length - 1 : currentSlide - 1);
  }, [currentSlide, banners.length, goToSlide]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(nextSlide, autoPlayInterval * 1000);
    return () => clearInterval(interval);
  }, [nextSlide, autoPlayInterval, banners.length]);

  if (isLoading) return <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-gray-100 rounded-2xl animate-pulse"></div>;
  if (!Array.isArray(banners) || banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg group">
      {/* Slides Container */}
      <div className="relative aspect-[3/1] md:aspect-[4/1] bg-gray-100">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentSlide
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105"
            }`}
          >
            {banner.link ? (
              <a href={banner.link} className="block w-full h-full">
                <div className="relative w-full h-full bg-gradient-to-l from-primary/20 via-accent/10 to-secondary/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {index === 0 ? "🎉" : index === 1 ? "💼" : "🌟"}
                    </div>
                    <p className="text-gray-600 font-medium text-lg">
                      {index === 0
                        ? "جایگاه تبلیغات ۱"
                        : index === 1
                          ? "جایگاه تبلیغات ۲"
                          : "جایگاه تبلیغات ۳"}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      تصویر بنر تبلیغاتی در اینجا قرار می‌گیرد
                    </p>
                  </div>
                </div>
              </a>
            ) : (
              <div className="relative w-full h-full bg-gradient-to-l from-primary/10 to-accent/10 flex items-center justify-center">
                <p className="text-gray-500">بنر تبلیغاتی</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center text-gray-700 hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-300"
            aria-label="بنر قبلی"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center text-gray-700 hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-300"
            aria-label="بنر بعدی"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? "w-8 h-2.5 bg-primary shadow-md"
                  : "w-2.5 h-2.5 bg-white/70 hover:bg-white"
              }`}
              aria-label={`بنر ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
