"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  ImageOff,
  Move,
} from "lucide-react";
import { formatPersianNumber } from "@/lib/utils";

interface ImageLightboxProps {
  images: { url: string; isMain?: boolean }[];
  initialIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 && initialIndex < images.length ? initialIndex : 0
  );
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const thumbnailsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement | null>(null);

  // Sync state changes with parent component
  const updateIndex = useCallback(
    (newIndex: number) => {
      setCurrentIndex(newIndex);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setIsLoading(true);
      setHasError(false);
      onIndexChange?.(newIndex);
    },
    [onIndexChange]
  );

  const goNext = useCallback(() => {
    if (!images || images.length <= 1) return;
    const nextIdx = (currentIndex + 1) % images.length;
    updateIndex(nextIdx);
  }, [currentIndex, images, updateIndex]);

  const goPrev = useCallback(() => {
    if (!images || images.length <= 1) return;
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    updateIndex(prevIdx);
  }, [currentIndex, images, updateIndex]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const nextZoom = Math.max(prev - 0.5, 1);
      if (nextZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return nextZoom;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleToggleZoom = () => {
    if (zoom > 1) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setZoom(2.2);
    }
  };

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (zoom === 1) goPrev();
      } else if (e.key === "ArrowRight") {
        if (zoom === 1) goNext();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, goNext, goPrev, zoom]);

  // Window listeners for smooth mouse dragging outside the image container
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      if (Math.abs(newX - position.x) > 3 || Math.abs(newY - position.y) > 3) {
        hasDragged.current = true;
      }
      setPosition({ x: newX, y: newY });
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isDragging, position.x, position.y]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbnailRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      hasDragged.current = false;
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      e.preventDefault();
    }
  };

  // Touch gesture handlers for mobile pan & swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1) {
      if (e.touches.length === 1) {
        setIsDragging(true);
        hasDragged.current = false;
        dragStart.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        };
      }
    } else {
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (zoom > 1 && isDragging && e.touches.length === 1) {
      const newX = e.touches[0].clientX - dragStart.current.x;
      const newY = e.touches[0].clientY - dragStart.current.y;
      if (Math.abs(newX - position.x) > 3 || Math.abs(newY - position.y) > 3) {
        hasDragged.current = true;
      }
      setPosition({ x: newX, y: newY });
    } else if (zoom === 1) {
      touchEndX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    if (zoom > 1) {
      setIsDragging(false);
    } else {
      if (touchStartX.current === null || touchEndX.current === null) {
        touchStartX.current = null;
        touchEndX.current = null;
        return;
      }

      const diff = touchStartX.current - touchEndX.current;
      const swipeThreshold = 45; // Minimum px distance for swipe

      if (diff > swipeThreshold) {
        // Swiped left -> next
        goNext();
      } else if (diff < -swipeThreshold) {
        // Swiped right -> previous
        goPrev();
      }

      touchStartX.current = null;
      touchEndX.current = null;
    }
  };

  if (!images || images.length === 0) return null;

  const currentImg = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-between bg-black/92 backdrop-blur-md select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="مشاهده تصویر"
      onClick={(e) => {
        if (e.target === e.currentTarget && !hasDragged.current) {
          onClose();
        }
      }}
    >
      {/* Top Header Bar */}
      <div
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Counter & Mode Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full text-white text-xs sm:text-sm font-medium shadow-sm">
            <span>{formatPersianNumber(currentIndex + 1)}</span>
            <span className="text-white/60">از</span>
            <span>{formatPersianNumber(images.length)}</span>
          </div>

          {zoom > 1 && (
            <div className="hidden md:flex items-center gap-1.5 bg-primary/20 border border-primary/30 text-primary-light px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md animate-fade-in">
              <Move size={13} />
              <span>تصویر را برای جابجایی بکشید</span>
            </div>
          )}
        </div>

        {/* Toolbar & Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/15 p-1 rounded-full text-white">
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-1.5 hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer"
              title="بزرگ‌نمایی (+)"
              aria-label="بزرگ‌نمایی"
            >
              <ZoomIn size={18} />
            </button>
            <span className="text-[11px] font-mono px-1 text-white/80 min-w-[32px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-1.5 hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer"
              title="کوچک‌نمایی (-)"
              aria-label="کوچک‌نمایی"
            >
              <ZoomOut size={18} />
            </button>
            {zoom > 1 && (
              <button
                onClick={handleResetZoom}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-amber-300 cursor-pointer"
                title="اندازه اصلی (0)"
                aria-label="اندازه اصلی"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow-md"
            title="بستن (Esc)"
            aria-label="بستن"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main Image Viewing Stage */}
      <div
        className="flex-1 relative w-full flex items-center justify-center p-4 sm:p-8 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget && !hasDragged.current) {
            onClose();
          }
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2 bg-black/60 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 text-white">
              <Loader2 size={28} className="animate-spin text-primary" />
              <span className="text-xs text-white/80">در حال بارگذاری تصویر...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-2xl border border-white/10 text-white/80 max-w-sm">
            <ImageOff size={48} className="text-white/40 mb-3" />
            <p className="text-sm font-medium">خطا در نمایش تصویر</p>
            <p className="text-xs text-white/50 mt-1">امکان بارگذاری این تصویر وجود ندارد</p>
          </div>
        ) : (
          <div
            className="relative max-w-full max-h-full flex items-center justify-center select-none"
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
              transition: isDragging ? "none" : "transform 200ms ease-out",
              cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (hasDragged.current) {
                hasDragged.current = false;
                return;
              }
              handleToggleZoom();
            }}
          >
            <img
              src={currentImg?.url}
              alt=""
              className="max-w-[92vw] max-h-[72vh] sm:max-h-[78vh] object-contain select-none rounded-xl shadow-2xl transition-opacity duration-200 pointer-events-none"
              style={{ opacity: isLoading ? 0.3 : 1 }}
              draggable={false}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          </div>
        )}

        {/* Navigation Arrows (Only show if not zoomed in or when navigating) */}
        {images.length > 1 && (
          <>
            {/* Previous Image Button (Left) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl backdrop-blur-md cursor-pointer"
              title="تصویر قبلی (جهت چپ)"
              aria-label="تصویر قبلی"
            >
              <ChevronLeft size={26} />
            </button>

            {/* Next Image Button (Right) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl backdrop-blur-md cursor-pointer"
              title="تصویر بعدی (جهت راست)"
              aria-label="تصویر بعدی"
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnails Strip */}
      {images.length > 1 && (
        <div
          className="w-full flex items-center justify-center px-4 py-3 z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={thumbnailsContainerRef}
            className="flex items-center gap-2 p-1.5 sm:p-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 max-w-[94vw] sm:max-w-2xl overflow-x-auto scrollbar-none"
          >
            {images.map((img, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  ref={isActive ? activeThumbnailRef : null}
                  onClick={() => updateIndex(idx)}
                  className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-primary shadow-lg ring-2 ring-primary/40 scale-105 opacity-100"
                      : "border-transparent opacity-50 hover:opacity-85 hover:scale-100"
                  }`}
                  title={`تصویر ${formatPersianNumber(idx + 1)}`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {img.isMain && (
                    <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-white text-[8px] sm:text-[9px] py-0.5 text-center font-bold">
                      اصلی
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
