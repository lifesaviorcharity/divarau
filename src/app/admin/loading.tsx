import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-gray-600 animate-pulse">در حال بارگذاری اطلاعات...</p>
    </div>
  );
}
