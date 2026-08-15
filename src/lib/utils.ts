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
 * Limit phone input to prevent entering too many digits.
 * Normal Australian mobile: 10 digits (e.g. 0412345678) or +61 412 345 678 (11 digits).
 * Maximum allowed digits = Normal digits + 3 more digits:
 * - Local / without '+': max 13 digits (10 + 3)
 * - With international prefix (+ / 61): max 14 digits (+61... -> 11 + 3 = 14, max 15 digits for E.164)
 */
export function sanitizePhoneInput(input: string, allowLeadingPlus = true): string {
  if (!input) return "";
  const converted = toEnglishDigits(input);
  const trimmed = converted.trimStart();
  const startsWithPlus = allowLeadingPlus && trimmed.startsWith("+");

  // Determine max allowed numeric digits (normal + 3 digits)
  // International with +: normal 11 + 3 = 14 digits (or max 15 for global E.164)
  // International with 61: normal 11 + 3 = 14 digits
  // Local (e.g. 04...): normal 10 + 3 = 13 digits
  const maxDigits = startsWithPlus ? 14 : (trimmed.startsWith("61") ? 14 : 13);

  let result = "";
  let digitCount = 0;

  let startIdx = 0;
  if (startsWithPlus) {
    result = "+";
    startIdx = trimmed.indexOf("+") + 1;
  }

  for (let i = startIdx; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (/\d/.test(char)) {
      if (digitCount < maxDigits) {
        result += char;
        digitCount++;
      }
    } else if (/[\s-]/.test(char)) {
      result += char;
    }
  }

  return result;
}

/**
 * Filter and limit pure digit string (e.g. for structured number inputs or WhatsApp).
 * Normal phone is 10 digits, max +3 more digits = 13 digits.
 */
export function limitDigits(input: string, maxDigits = 13): string {
  if (!input) return "";
  const english = toEnglishDigits(input);
  const digits = english.replace(/\D/g, "");
  return digits.slice(0, maxDigits);
}

/**
 * Normalize a mobile number to E.164 format.
 * Any phone number entered without a country code is automatically converted to the Australian (+61) format.
 * Accepts: 04XX XXX XXX, 04XXXXXXXX, 4XXXXXXXX, 614XXXXXXXX, +614XXXXXXXX, +98..., etc.
 * Enforces maximum +3 digits over normal digits (max 13 digits for local, max 14-15 for international).
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
    const digits = cleaned.slice(1).replace(/\D/g, "");
    if (digits.length > 15) {
      throw new Error("شماره موبایل بیش از حد مجاز طولانی است (حداکثر ۱۵ رقم).");
    }
    if (digits.length >= 8 && digits.length <= 15) {
      return `+${digits}`;
    }
    throw new Error("شماره موبایل نامعتبر است. لطفاً شماره معتبر وارد کنید.");
  }

  // If starts with '61' (e.g. 61412345678 or 61XXXXXXXXX)
  if (cleaned.startsWith("61")) {
    if (cleaned.length > 14) {
      throw new Error("شماره موبایل بیش از حد مجاز طولانی است (حداکثر ۱۴ رقم).");
    }
    if (cleaned.length >= 10 && cleaned.length <= 14) {
      return `+${cleaned}`;
    }
    throw new Error("شماره موبایل نامعتبر است. لطفاً شماره معتبر وارد کنید.");
  }

  // If starts with '0' (e.g. 0412345678 or 04XX XXX XXX), strip the leading 0
  if (cleaned.startsWith("0")) {
    if (cleaned.length > 13) {
      throw new Error("شماره موبایل بیش از حد مجاز طولانی است (حداکثر ۱۳ رقم).");
    }
    cleaned = cleaned.slice(1);
  }

  // Total raw digits check for numbers entered without country code
  if (cleaned.length > 13) {
    throw new Error("شماره موبایل بیش از حد مجاز طولانی است (حداکثر ۱۳ رقم).");
  }

  // Any number entered without country code is converted to Australian +61 format (+61xxxxxxxx)
  if (/^\d{8,13}$/.test(cleaned)) {
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


