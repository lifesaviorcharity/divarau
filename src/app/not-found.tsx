import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-6xl font-black gradient-text mb-4">۴۰۴</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          صفحه مورد نظر یافت نشد
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          صفحه‌ای که به‌دنبال آن هستید حذف شده یا آدرس آن تغییر کرده است.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
