export function formatPersianNumber(number: number | string): string {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return number.toString().replace(/\d/g, (x) => persianNumbers[parseInt(x)]);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price);
}

export function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "چند لحظه پیش";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return formatPersianNumber(diffInMinutes) + " دقیقه پیش";
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return formatPersianNumber(diffInHours) + " ساعت پیش";
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return formatPersianNumber(diffInDays) + " روز پیش";
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return formatPersianNumber(diffInMonths) + " ماه پیش";
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return formatPersianNumber(diffInYears) + " سال پیش";
}

export function toJalali(date: Date | string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
}

/**
 * Convert Persian and Arabic digits to English digits
 */
export function toEnglishDigits(str: string): string {
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
  }
  return result;
}

/**
 * Normalize a mobile number to E.164 format.
 * Any phone number entered without a country code is automatically converted to the Australian (+61) format.
 * Accepts: 04XX XXX XXX, 04XXXXXXXX, 4XXXXXXXX, 614XXXXXXXX, +614XXXXXXXX, +98..., etc.
 * Returns: +614XXXXXXXX or E.164 formatted string (+...)
 */
export function normalizeAustralianMobile(phone: string): string {
  const englishPhone = toEnglishDigits(phone || "");
  let cleaned = englishPhone.replace(/[^\d+]/g, "");

  if (!cleaned) {
    throw new Error("لطفاً شماره موبایل را وارد کنید.");
  }

  // If already starts with '+', keep standard E.164
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1);
    if (digits.length >= 8 && digits.length <= 15) {
      return cleaned;
    }
    throw new Error("شماره موبایل نامعتبر است. لطفاً شماره معتبر وارد کنید.");
  }

  // If starts with '61' (e.g. 61412345678 or 61XXXXXXXXX)
  if (cleaned.startsWith("61") && cleaned.length >= 10) {
    return `+${cleaned}`;
  }

  // If starts with '0' (e.g. 0412345678 or 04XX XXX XXX), strip the leading 0
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // Any number entered without country code is converted to Australian +61 format (+61xxxxxxxx)
  if (/^\d{8,12}$/.test(cleaned)) {
    return `+61${cleaned}`;
  }

  throw new Error("شماره موبایل نامعتبر است. لطفاً شماره معتبر وارد کنید.");
}

/**
 * Validate whether a string looks like a valid mobile number.
 */
export function isValidAustralianMobile(phone: string): boolean {
  try {
    const normalized = normalizeAustralianMobile(phone);
    return /^\+[1-9]\d{7,14}$/.test(normalized);
  } catch {
    return false;
  }
}

