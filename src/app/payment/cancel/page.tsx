"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-scale-in">
        <div className="w-20 h-20 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} />
        </div>
        
        <h2 className="text-2xl font-black text-gray-800 mb-2">پرداخت لغو شد</h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          شما از فرآیند پرداخت انصراف دادید. هیچ مبلغی از حساب شما کسر نشده است.
        </p>
        
        <button 
          onClick={() => router.push("/profile")}
          className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors font-bold shadow-md"
        >
          بازگشت به حساب کاربری
        </button>
      </div>
    </div>
  );
}
