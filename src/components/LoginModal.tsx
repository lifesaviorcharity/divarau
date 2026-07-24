import { useState, useEffect, useCallback } from "react";
import { Phone, Shield, Loader2, X } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatPersianNumber } from "@/lib/utils";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sessionDuration, setSessionDuration] = useState("30");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.sessionDuration) {
          setSessionDuration(data.sessionDuration);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setStep("phone");
      setMobile("");
      setOtp(new Array(OTP_LENGTH).fill(""));
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOTP = useCallback(async () => {
    if (!mobile || mobile.replace(/\D/g, "").length < 8) {
      setError("لطفاً شماره موبایل معتبر وارد کنید");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep("otp");
        setCountdown(RESEND_COOLDOWN_SECONDS);
        setOtp(new Array(OTP_LENGTH).fill(""));
      } else {
        setError(data.error || "خطایی رخ داد.");
      }
    } catch (err: any) {
      setError(err?.message || "خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  }, [mobile]);

  const handleVerifyOTP = async (overrideCode?: string) => {
    const code = typeof overrideCode === "string" ? overrideCode : otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError(`لطفاً کد ${OTP_LENGTH} رقمی را وارد کنید`);
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        mobile,
        otp: code,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "کد وارد شده ناصحیح یا منقضی شده است" : res.error);
        setIsLoading(false);
      } else if (res?.ok) {
        setError("");
        onClose();
        window.location.reload();
      } else {
        setError("خطا در ورود به حساب کاربری");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("verify error:", err);
      if (err?.name === "RedirectError" || err?.message?.includes("NEXT_REDIRECT")) {
        onClose();
        window.location.reload();
        return;
      }
      setError(err?.message || "خطا در ارتباط با سرور");
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    if (value && index < OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`modal-otp-${index + 1}`);
      nextInput?.focus();
    }

    setOtp((prev) => {
      const newOtp = [...prev];
      newOtp[index] = value;
      const code = newOtp.join("");
      if (code.length === OTP_LENGTH) {
        setTimeout(() => handleVerifyOTP(code), 10);
      }
      return newOtp;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-8 animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Shield size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-black text-gray-800">
            {step === "phone" ? "ورود / ایجاد حساب کاربری" : "تأیید شماره موبایل"}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {step === "phone"
              ? "جهت ثبت نظر با حساب کاربری خود وارد شوید"
              : `کد تأیید به شماره ${mobile} ارسال شد`}
          </p>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <div>
              <div className="relative">
                <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/[^0-9+]/g, ""));
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                  placeholder="04XX XXX XXX"
                  className="w-full pr-10 pl-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr"
                  maxLength={15}
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <button
              onClick={handleSendOTP}
              disabled={isLoading}
              className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "ورود / ثبت‌نام سریع"}
            </button>

            {/* Trust info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl mt-2">
              <Shield size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-600 leading-5">
                پس از ورود به مدت {formatPersianNumber(sessionDuration)} روز نیازی به دریافت مجدد کد تأیید نخواهید داشت.
              </p>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2.5" dir="ltr">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`modal-otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  autoFocus={i === 0}
                  className="w-11 h-13 text-center text-xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              ))}
            </div>
            {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
            <button
              onClick={() => handleVerifyOTP()}
              disabled={isLoading}
              className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "تأیید و ورود"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
