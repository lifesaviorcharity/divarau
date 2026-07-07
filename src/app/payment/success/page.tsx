"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  useEffect(() => {
    if (!token || !type || !id) {
      setStatus("error");
      setErrorMsg("اطلاعات پرداخت نامعتبر است.");
      return;
    }

    const capturePayment = async () => {
      try {
        const res = await fetch("/api/payment/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, type, id })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data.error || "تأیید تراکنش با خطا مواجه شد.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg("خطا در برقراری ارتباط با سرور.");
      }
    };

    capturePayment();
  }, [token, type, id]);

  return (
    <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-scale-in">
      {status === "loading" && (
        <div className="space-y-4">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">در حال بررسی تراکنش...</h2>
          <p className="text-sm text-gray-500">لطفاً این صفحه را نبندید</p>
        </div>
      )}
      
      {status === "success" && (
        <div className="space-y-4">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-800">پرداخت موفقیت‌آمیز بود!</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            تراکنش شما با موفقیت انجام شد و آگهی شما اکنون فعال است.
          </p>
          <button 
            onClick={() => router.push("/profile")}
            className="mt-6 w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-bold shadow-md"
          >
            مشاهده در حساب کاربری
          </button>
        </div>
      )}
      
      {status === "error" && (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">خطا در پرداخت</h2>
          <p className="text-sm text-gray-600">{errorMsg}</p>
          <button 
            onClick={() => router.push("/profile")}
            className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold"
          >
            بازگشت به حساب کاربری
          </button>
        </div>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="animate-spin text-primary" size={32} />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
