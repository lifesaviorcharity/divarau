"use client";

import { useState, useEffect, useCallback } from "react";
import { Phone, ArrowLeft, Shield, Loader2, RefreshCw } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatPersianNumber } from "@/lib/utils";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
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

  // Redirect if already logged in (smart session — no SMS needed)
  useEffect(() => {
    if (sessionStatus === "authenticated" && session) {
      router.replace("/");
    }
  }, [sessionStatus, session, router]);

  // Countdown timer for resend cooldown
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

  const handleResendOTP = useCallback(async () => {
    if (countdown > 0) return;
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });

      const data = await res.json();
      if (res.ok) {
        setCountdown(RESEND_COOLDOWN_SECONDS);
        setOtp(new Array(OTP_LENGTH).fill(""));
        setError("");
      } else {
        setError(data.error || "خطایی رخ داد.");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  }, [mobile, countdown]);

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
        const targetUrl = searchParams.get("callbackUrl") || "/";
        window.location.href = targetUrl;
      } else {
        setError("خطا در ورود به حساب کاربری");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("signIn error:", err);
      if (err?.name === "RedirectError" || err?.message?.includes("NEXT_REDIRECT")) {
        window.location.href = "/";
        return;
      }
      setError(err?.message || "خطا در ارتباط با سرور");
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Allow only digits
    if (value && !/^\d$/.test(value)) return;

    // Auto focus next
    if (value && index < OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    setOtp((prev) => {
      const newOtp = [...prev];
      newOtp[index] = value;
      const code = newOtp.join("");
      
      // Auto-submit when all digits are filled
      if (code.length === OTP_LENGTH) {
        setTimeout(() => handleVerifyOTP(code), 10);
      }
      
      return newOtp;
    });
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle paste for OTP (auto-fill from clipboard)
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasteData.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < OTP_LENGTH && i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);

    // Focus the next empty input or last input
    const nextEmptyIndex = newOtp.findIndex((d) => !d);
    const focusIndex = nextEmptyIndex === -1 ? OTP_LENGTH - 1 : nextEmptyIndex;
    const input = document.getElementById(`otp-${focusIndex}`);
    input?.focus();

    // Auto-submit if all filled
    if (pasteData.length >= OTP_LENGTH) {
      setTimeout(() => handleVerifyOTP(pasteData.substring(0, OTP_LENGTH)), 10);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Show loading while checking session
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // Don't render login if already authenticated
  if (sessionStatus === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-scale-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
              <Shield size={32} className="text-primary" />
            </div>
            <h1 className="text-xl font-black text-gray-800">
              {step === "phone" ? "ورود / ثبت‌نام" : "تأیید شماره موبایل"}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              {step === "phone"
                ? "شماره موبایل استرالیایی خود را وارد کنید"
                : `کد تأیید به شماره ${mobile} ارسال شد`}
            </p>
          </div>

          {/* Phone Step */}
          {step === "phone" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  شماره موبایل
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/[^0-9+]/g, ""));
                      setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendOTP();
                    }}
                    placeholder="04XX XXX XXX"
                    className="w-full pr-10 pl-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr"
                    maxLength={15}
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  فرمت شماره موبایل استرالیا: 04XX XXX XXX
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
              )}

              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    ارسال کد تأیید
                    <ArrowLeft size={16} />
                  </>
                )}
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

          {/* OTP Step */}
          {step === "otp" && (
            <div className="space-y-6">
              {/* OTP Input */}
              <div
                className="flex items-center justify-center gap-2.5"
                dir="ltr"
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    autoFocus={i === 0}
                    className="w-11 h-13 text-center text-xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-500 font-medium text-center">
                  {error}
                </p>
              )}

              <button
                onClick={() => handleVerifyOTP()}
                disabled={isLoading}
                className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "تأیید و ورود"
                )}
              </button>

              {/* Resend & Change Number */}
              <div className="flex items-center justify-center gap-3 text-xs">
                <button
                  onClick={() => {
                    setStep("phone");
                    setOtp(new Array(OTP_LENGTH).fill(""));
                    setError("");
                  }}
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  تغییر شماره موبایل
                </button>
                <span className="text-gray-300">|</span>
                {countdown > 0 ? (
                  <span className="text-gray-400 font-medium tabular-nums">
                    ارسال مجدد ({formatCountdown(countdown)})
                  </span>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-primary font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw size={12} />
                    ارسال مجدد کد
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
