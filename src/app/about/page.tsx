import type { Metadata } from "next";
import { Heart, Globe, Users, Target, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "درباره ما | مشاغل ایرانیان و فارسی‌زبانان استرالیا",
  description:
    "با هدف ایجاد پل ارتباطی مؤثر میان ایرانیان مقیم استرالیا و کسب‌وکارهای ایرانی فعال در این کشور.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-black gradient-text mb-4">
            درباره ما
          </h1>
          <div className="w-20 h-1 bg-gradient-to-l from-primary to-accent rounded-full mx-auto" />
        </div>

        {/* Welcome */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 animate-fade-in">
          <p className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles size={22} className="text-accent" />
            به وب‌سایت «مشاغل ایرانیان و فارسی‌زبانان استرالیا» خوش آمدید!
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            ما با هدف ایجاد یک پل ارتباطی مؤثر میان ایرانیان مقیم استرالیا و
            کسب‌وکارهای ایرانی فعال در این کشور، این وب‌سایت را راه‌اندازی
            کرده‌ایم.
          </p>
          <p className="text-gray-600 leading-relaxed">
            در دنیای امروز، دسترسی سریع، دقیق و قابل اعتماد به خدمات و
            اطلاعات، یک نیاز اساسی‌ست – به‌ویژه برای مهاجران. این پلتفرم طراحی
            شده تا شما بتوانید به‌سادگی خدمات مورد نظر خود را پیدا کرده و با
            اطمینان با کسب‌وکارهای ایرانی ارتباط برقرار کنید.
          </p>
        </div>

        {/* Goals */}
        <div className="bg-gradient-to-l from-primary/5 to-accent/5 rounded-2xl p-6 md:p-8 mb-8 animate-fade-in">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Target size={22} className="text-primary" />
            اهداف ما
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "گردآوری و معرفی مشاغل و خدمات ایرانی و فارسی‌زبان در سراسر استرالیا",
              "تقویت شبکه ارتباطی بین صاحبان کسب‌وکار و جامعه ایرانی",
              "فراهم کردن بستری برای بازاریابی رایگان و موثر برای مشاغل کوچک و بزرگ",
              "افزایش حس همبستگی و حمایت متقابل در میان هم‌وطنان و هم‌زبانان خارج از کشور",
            ].map((goal, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm"
              >
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{goal}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who can use */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 animate-fade-in">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users size={22} className="text-blue-600" />
            چه کسانی می‌توانند از این وب‌سایت استفاده کنند؟
          </h2>
          <div className="space-y-3">
            {[
              "صاحبان کسب‌وکار و ارائه‌دهندگان خدمات ایرانی",
              "ایرانیان مقیم استرالیا در جستجوی خدمات، مشاوره و خرید از هم‌وطنان",
              "افرادی که به‌دنبال اطلاعات دقیق، نظرات کاربران و تجربه‌های واقعی هستند",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div className="text-center p-8 animate-fade-in">
          <p className="text-gray-600 leading-relaxed mb-4">
            با افتخار، در کنار شما هستیم تا با معرفی و حمایت از مشاغل ایرانی،
            یک جامعه قوی‌تر و همبسته‌تر در استرالیا بسازیم.
          </p>
          <p className="text-lg font-bold text-primary flex items-center justify-center gap-2">
            با ما باشید – با هم رشد کنیم
            <Heart size={18} className="text-primary fill-primary" />
          </p>
        </div>
      </div>
    </div>
  );
}
