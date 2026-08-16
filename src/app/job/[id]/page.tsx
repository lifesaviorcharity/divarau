"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Globe,
  Mail,
  Clock,
  Star,
  Eye,
  MessageCircle,
  ExternalLink,
  X,
  ArrowRight,
  UserCircle,
  Maximize2
} from "lucide-react";
import { FaWhatsapp, FaTelegram, FaInstagram } from "react-icons/fa";
import { useSession } from "next-auth/react";
import LoginModal from "@/components/LoginModal";
import { formatPersianNumber } from "@/lib/utils";
import ImageLightbox from "@/components/ImageLightbox";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/jobs/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setJob(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [params.id]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">در حال بارگذاری...</div>;
  }

  if (!job || job.error) {
    return <div className="min-h-screen flex items-center justify-center">شغل یافت نشد یا مشکلی رخ داده است.</div>;
  }

  const isFinal = job.status === "FINAL" || job.status === "PAID";
  const isApproved = job.status === "APPROVED";
  const isOwner = !!(session?.user && (
    ((session.user as any).id && String((session.user as any).id) === String(job.userId)) ||
    (session.user.mobile && job.user?.mobile && session.user.mobile === job.user.mobile) ||
    session.user.role === "ADMIN"
  ));
  const canViewContact = isFinal || isOwner;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Actions & Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <a href="/" className="hover:text-primary">خانه</a>
            <ChevronLeft size={12} />
            <a href="/jobs" className="hover:text-primary">مشاغل</a>
            <ChevronLeft size={12} />
            <a href={`/jobs?category=${job.category?.id || job.categoryId || ""}`} className="hover:text-primary">{job.category?.name || "گروه"}</a>
            <ChevronLeft size={12} />
            <a href={`/jobs?category=${job.category?.id || job.categoryId || ""}&sub=${job.subCategory?.slug || ""}`} className="hover:text-primary">{job.subCategory?.name || "دسته"}</a>
            <ChevronLeft size={12} />
            <span className="text-gray-700 truncate max-w-[150px] sm:max-w-xs">{job.title}</span>
          </div>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowRight size={16} />
            بازگشت
          </button>
        </div>

        {job.adminNote && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-6">
            <h4 className="font-bold text-amber-900 text-sm mb-1">⚠️ پیام مدیریت در خصوص این آگهی:</h4>
            <p className="text-xs text-amber-800 leading-relaxed">{job.adminNote.replace('[NEEDS_EDIT] ', '')}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Info Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {/* Category Badge */}
            <p className="text-xs text-gray-500 mb-2">
              گروه شغلی: {job.category?.name} | دسته شغلی: {job.subCategory?.name}
            </p>

            {/* Title */}
            <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-2">
              {job.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                در {job.city?.name}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {job.viewCount || 0} بازدید
              </span>
            </div>

            {/* Contact Button */}
            <button
              onClick={() => canViewContact && setShowContact(!showContact)}
              disabled={!canViewContact}
              className={`w-full py-3 rounded-xl font-bold text-sm mb-4 transition-all duration-200 ${!canViewContact
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : showContact
                  ? "bg-primary-darker text-white shadow-inner cursor-pointer"
                  : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-xl cursor-pointer"
                }`}
            >
              {canViewContact ? "راه‌های ارتباطی" : "راه‌های ارتباطی"}
            </button>

            {/* Notice for unfinalized job contact info */}
            {!canViewContact && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 text-center text-xs text-amber-800 leading-relaxed">
                راه‌های ارتباطی این آگهی پس از تأیید نهایی و پرداخت فعال و قابل مشاهده خواهند بود.
              </div>
            )}

            {/* Contact Details */}
            {showContact && canViewContact && (
              <div className="border border-gray-100 rounded-xl p-5 mb-6 space-y-4 animate-scale-in bg-gray-50/50">
                {job.phone && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-gray-700 block">
                      {job.phone.includes(",") ? "شماره‌های تماس:" : "شماره تماس:"}
                    </span>
                    <div className="space-y-1.5">
                      {job.phone.split(/[,،\n]+/).map((ph: string, idx: number) => {
                        const cleanPh = ph.trim();
                        if (!cleanPh) return null;
                        return (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">شماره {idx + 1}:</span>
                            <a
                              href={`tel:${cleanPh.replace(/\s+/g, "")}`}
                              className="text-sm text-primary font-medium inline-block hover:underline font-mono" dir="ltr"
                            >
                              {cleanPh}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {job.address && (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-semibold text-gray-700 flex-shrink-0">آدرس پستی:</span>
                    <span className="text-sm text-gray-600 text-left">{job.address}</span>
                  </div>
                )}
                {job.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">آدرس ایمیل:</span>
                    <a href={`mailto:${job.email}`} className="text-sm text-primary">{job.email}</a>
                  </div>
                )}
                {job.website && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">آدرس سایت:</span>
                    <a href={job.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1">
                      {job.website} <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {/* Social Links */}
                {(job.whatsapp || job.telegram || job.instagram) && (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-2">شبکه‌های اجتماعی:</span>
                    <div className="flex items-center gap-3">
                      {job.telegram && (
                        <a href={`https://t.me/${job.telegram}`} target="_blank" rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                          <FaTelegram size={20} />
                        </a>
                      )}
                      {job.whatsapp && (
                        <a href={`https://wa.me/${job.whatsapp}`} target="_blank" rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                          <FaWhatsapp size={20} />
                        </a>
                      )}
                      {job.instagram && (
                        <a href={`https://instagram.com/${job.instagram}`} target="_blank" rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                          <FaInstagram size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2">توضیحات:</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {/* Work Hours */}
            {job.workHours && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-gray-800 mb-2">ساعات کاری:</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.workHours}</p>
              </div>
            )}
          </div>

          {/* Image Gallery */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
            {/* Main Image Stage */}
            <div className="relative aspect-[4/3] bg-gray-100 flex items-center justify-center group overflow-hidden">
              {!job.images || job.images.length === 0 ? (
                <div className="text-center text-gray-400 p-6">
                  <div className="text-5xl mb-2">🏢</div>
                  <p className="text-sm">
                    تصویری برای این شغل ثبت نشده است
                  </p>
                </div>
              ) : (
                <div
                  className="relative w-full h-full cursor-pointer flex items-center justify-center"
                  onClick={() => setLightboxOpen(true)}
                  title="کلیک برای بزرگ‌نمایی تصویر"
                >
                  <img
                    src={job.images[currentImage]?.url}
                    alt={job.title}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                  />

                  {/* Expand / Lightbox Cue Badge on hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                    <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform">
                      <Maximize2 size={14} />
                      بزرگ‌نمایی و مشاهده همه تصاویر
                    </span>
                  </div>

                  {/* Image Counter Badge on bottom-left */}
                  {job.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium pointer-events-none">
                      {formatPersianNumber(currentImage + 1)} / {formatPersianNumber(job.images.length)}
                    </div>
                  )}
                </div>
              )}

              {/* Nav Arrows */}
              {job.images && job.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev - 1 + job.images.length) % job.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                    title="تصویر قبلی"
                    aria-label="تصویر قبلی"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev + 1) % job.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                    title="تصویر بعدی"
                    aria-label="تصویر بعدی"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {job.images && job.images.length > 1 && (
              <div className="flex items-center gap-2 p-3 justify-center overflow-x-auto bg-gray-50/50 border-t border-gray-100">
                {job.images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${i === currentImage
                        ? "border-primary shadow-md scale-105 opacity-100"
                        : "border-gray-200 opacity-60 hover:opacity-90 hover:scale-100"
                      }`}
                    title={`تصویر ${formatPersianNumber(i + 1)}`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Image Lightbox Modal */}
          {lightboxOpen && job.images && job.images.length > 0 && (
            <ImageLightbox
              images={job.images}
              initialIndex={currentImage}
              onIndexChange={setCurrentImage}
              onClose={() => setLightboxOpen(false)}
            />
          )}
        </div>

        {/* Reviews Section (Bottom) */}
        {(isFinal || isApproved) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reviews List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-primary">دیدگاه‌ها</h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-gray-800">{formatPersianNumber(job.rating)}</span>
                  <span className="text-xs text-gray-400">از ۵</span>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="flex items-center gap-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18}
                    className={i < Math.round(job.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
                  />
                ))}
                <span className="text-xs text-gray-400">از مجموع {formatPersianNumber(job.reviewCount)} امتیاز</span>
              </div>

              {/* Reviews List (Only show if enabled) */}
              {job.reviewsEnabled && (
                <div className="space-y-4">
                  {job.reviews?.length > 0 ? job.reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-gray-800">{review.user?.username || "کاربر سایت"}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12}
                              className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{review.comment}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-400 text-center py-4">هنوز دیدگاهی ثبت نشده است.</p>
                  )}
                </div>
              )}
            </div>

            {/* Review Form */}
            <div id="review-form-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">ثبت نظر شما</h3>

              {!session ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCircle className="text-primary" size={24} />
                  </div>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    جهت ثبت نظر با حساب کاربری خود وارد شوید و در صورتیکه حساب کاربری ندارید اقدام به ایجاد آن نمایید.
                  </p>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
                  >
                    ورود / ایجاد حساب کاربری
                  </button>
                </div>
              ) : (
                <>
                  {/* Star Rating Input */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <button key={i} onClick={() => setNewRating(i + 1)} className="transition-transform hover:scale-110">
                        <Star size={28}
                          className={i < newRating ? "text-amber-400 fill-amber-400" : "text-gray-300 fill-gray-300"}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Comment (Hide if reviews disabled) */}
                  {job.reviewsEnabled && (
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="نظر خود را بنویسید..."
                      className="w-full h-32 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all mb-4"
                    />
                  )}

                  <button
                    onClick={async () => {
                      if (newRating === 0) {
                        alert("لطفاً امتیاز خود را ثبت کنید");
                        return;
                      }
                      try {
                        const res = await fetch(`/api/jobs/${job.id}/reviews`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ rating: newRating, comment: job.reviewsEnabled ? newComment : null })
                        });
                        if (res.ok) {
                          alert(job.reviewsEnabled ? "نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده خواهد شد." : "امتیاز شما با موفقیت ثبت شد.");
                          setNewRating(0);
                          setNewComment("");
                        } else {
                          alert("خطا در ثبت اطلاعات");
                        }
                      } catch (e) {
                        alert("خطا در ارتباط با سرور");
                      }
                    }}
                    className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
                  >
                    {job.reviewsEnabled ? "ثبت نظر" : "ثبت امتیاز"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
