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
 * Normalize an Australian mobile number to E.164 format for Twilio.
 * Accepts: 04XX XXX XXX, 04XXXXXXXX, +614XXXXXXXX, 614XXXXXXXX
 * Returns: +614XXXXXXXX
 */
export function normalizeAustralianMobile(phone: string): string {
  const englishPhone = toEnglishDigits(phone || "");
  // Strip all non-digit characters except leading +
  let cleaned = englishPhone.replace(/[^\d+]/g, "");

  // If starts with +61, already international
  if (cleaned.startsWith("+61")) {
    cleaned = cleaned.slice(3); // remove +61
  } else if (cleaned.startsWith("61") && cleaned.length >= 11) {
    cleaned = cleaned.slice(2); // remove 61
  } else if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1); // remove leading 0
  }

  // At this point we should have 9 digits starting with 4
  if (!/^4\d{8}$/.test(cleaned)) {
    throw new Error("شماره موبایل استرالیایی نامعتبر است.");
  }

  return `+61${cleaned}`;
}

/**
 * Validate whether a string looks like a valid Australian mobile number.
 */
export function isValidAustralianMobile(phone: string): boolean {
  try {
    normalizeAustralianMobile(phone);
    return true;
  } catch {
    return false;
  }
}

