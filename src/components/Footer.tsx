import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Heart,
  Instagram,
  Send,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-200 text-gray-300 mt-16">
      {/* Main Footer */}
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12"> */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10"> */}
      {/* About */}
      {/* <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="gradient-text">AUIR</span>
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              مشاغل ایرانیان و فارسی‌زبانان استرالیا — پل ارتباطی مؤثر میان
              ایرانیان مقیم استرالیا و کسب‌وکارهای ایرانی فعال در این کشور.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-primary flex items-center justify-center transition-colors duration-200"
                aria-label="اینستاگرام"
              >
                <Instagram size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-blue-500 flex items-center justify-center transition-colors duration-200"
                aria-label="تلگرام"
              >
                <Send size={16} />
              </a>
            </div>
          </div> */}

      {/* Quick Links */}
      {/* <div>
            <h4 className="text-base font-bold text-white mb-4">
              دسترسی سریع
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "مشاهده مشاغل و آگهی‌ها", href: "/jobs" },
                { label: "ثبت مشاغل", href: "/register-job" },
                { label: "آگهی‌های رایگان", href: "/register-ad/free" },
                { label: "آگهی‌های تجاری", href: "/register-ad/commercial" },
                { label: "درباره ما", href: "/about" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-primary transition-colors duration-200 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/50" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}

      {/* Popular Categories */}
      {/* <div>
            <h4 className="text-base font-bold text-white mb-4">
              گروه‌های پرطرفدار
            </h4>
            <ul className="space-y-2.5">
              {[
                "پزشکی و خدمات بالینی",
                "خدمات فنی",
                "خدمات عمومی",
                "آموزش و مشاوره",
                "فروشگاه‌ها",
              ].map((cat) => (
                <li key={cat}>
                  <span className="text-sm text-gray-400 hover:text-primary transition-colors duration-200 cursor-pointer flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-accent/50" />
                    {cat}
                  </span>
                </li>
              ))}
            </ul>
          </div> */}

      {/* Contact */}
      {/* <div>
            <h4 className="text-base font-bold text-white mb-4">تماس با ما</h4>
            <div className="space-y-3">
              <a
                href="mailto:info@auir.com.au"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors"
              >
                <Mail size={16} />
                info@auir.com.au
              </a>
              <a
                href="tel:+61000000000"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors"
              >
                <Phone size={16} />
                +61 000 000 000
              </a>
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={16} />
                استرالیا
              </span>
              <a
                href="https://auir.com.au"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors"
              >
                <Globe size={16} />
                www.auir.com.au
              </a>
            </div>
          </div> */}
      {/* </div> */}
      {/* </div> */}

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500 text-center sm:text-right">
            © {new Date().getFullYear()} مشاغل ایرانیان و فارسی‌زبانان
            استرالیا. تمامی حقوق محفوظ است.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            ساخته شده با
            <Heart size={12} className="text-primary fill-primary" />
            برای جامعه ایرانی استرالیا
          </p>
        </div>
      </div>
    </footer>
  );
}
