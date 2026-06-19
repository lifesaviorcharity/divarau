"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState("");

  const type = params.type as string; // 'ad' or 'job'
  const id = params.id as string;

  useEffect(() => {
    if (!type || !id) return;

    const initPayment = async () => {
      try {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id })
        });
        
        const data = await res.json();
        
        if (res.ok && data.approveUrl) {
          // Redirect securely to PayPal
          window.location.href = data.approveUrl;
        } else {
          setError(data.error || "خطا در ایجاد تراکنش.");
        }
      } catch (err) {
        setError("خطا در برقراری ارتباط با سرور");
      }
    };

    initPayment();
  }, [type, id]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">خطا در پرداخت</h2>
            <p className="text-sm text-gray-600">{error}</p>
            <button 
              onClick={() => router.push("/profile")}
              className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold"
            >
              بازگشت به حساب کاربری
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 size={48} className="animate-spin text-primary mx-auto" />
            <h2 className="text-lg font-bold text-gray-800">در حال انتقال به درگاه پرداخت...</h2>
            <p className="text-sm text-gray-500">لطفاً منتظر بمانید</p>
          </div>
        )}
      </div>
    </div>
  );
}
