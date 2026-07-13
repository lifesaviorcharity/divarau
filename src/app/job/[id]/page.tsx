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
  UserCircle
} from "lucide-react";
import { FaWhatsapp, FaTelegram, FaInstagram } from "react-icons/fa";
import { useSession } from "next-auth/react";
import LoginModal from "@/components/LoginModal";

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
            <a href={`/jobs?category=${job.category?.slug || ""}`} className="hover:text-primary">{job.category?.name || "گروه"}</a>
            <ChevronLeft size={12} />
            <a href={`/jobs?category=${job.category?.slug || ""}&sub=${job.subCategory?.slug || ""}`} className="hover:text-primary">{job.subCategory?.name || "دسته"}</a>
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
              onClick={() => isFinal && setShowContact(!showContact)}
              disabled={!isFinal}
              className={`w-full py-3 rounded-xl font-bold text-sm mb-6 transition-all duration-200 ${!isFinal
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : showContact
                  ? "bg-primary-darker text-white shadow-inner"
                  : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-xl"
                }`}
            >
              {isFinal ? "راه‌های ارتباطی" : "راه‌های ارتباطی (غیرفعال)"}
            </button>

            {/* Contact Details (i7) */}
            {showContact && isFinal && (
              <div className="border border-gray-100 rounded-xl p-5 mb-6 space-y-4 animate-scale-in bg-gray-50/50">
                {job.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">شماره تماس:</span>
                    <a href={`tel:${job.phone}`} className="text-sm text-primary font-medium">{job.phone}</a>
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
            <div className="border-t border-gray-100 pt-4 mb-4">
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Main Image */}
            <div className="relative aspect-[4/3] bg-gray-100 flex items-center justify-center">
              {isApproved || (!job.images || job.images.length === 0) ? (
                <div className="text-center text-gray-400">
                  <div className="text-5xl mb-2">🏢</div>
                  <p className="text-sm">
                    {isFinal ? "تصویری ثبت نشده است" : "تصاویر پس از تأیید نهایی نمایش داده می‌شوند"}
                  </p>
                </div>
              ) : (
                <img
                  src={job.images[currentImage]?.url}
                  alt={job.title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Nav Arrows */}
              {isFinal && job.images && job.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(Math.max(0, currentImage - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImage(Math.min(job.images.length - 1, currentImage + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {isFinal && job.images && job.images.length > 1 && (
              <div className="flex items-center gap-2 p-3 justify-center">
                {job.images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === currentImage ? "border-primary shadow-md" : "border-gray-200 opacity-60"
                      }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section (Bottom) */}
        {isFinal && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reviews List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-primary">دیدگاه‌ها</h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-gray-800">{job.rating}</span>
                  <span className="text-xs text-gray-400">از ۵</span>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18}
                    className={i < Math.round(job.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
                  />
                ))}
                <span className="text-xs text-gray-400">از مجموع {job.reviewCount} امتیاز</span>
              </div>

              {/* Register Review Button */}
              <button
                onClick={() => {
                  setShowReviewForm(true);
                  document.getElementById('review-form-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 mb-6 border-2 border-primary/20 text-primary text-sm font-semibold rounded-xl hover:bg-primary/5 transition-colors"
              >
                ثبت دیدگاه
              </button>

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
