// Job categories and subcategories data for the entire application
// This is the seed data that will be used in both the database and frontend

export interface SubCategory {
  name: string;
  slug: string;
}

export interface Category {
  name: string;
  icon: string;
  subCategories: SubCategory[];
}

export const jobCategories: Category[] = [
  {
    name: "پزشکی و خدمات بالینی",
    icon: "🩺",
    subCategories: [
      { name: "پزشک عمومی", slug: "general-practitioner" },
      { name: "پزشک متخصص", slug: "specialist-doctor" },
      { name: "دندانپزشک", slug: "dentist" },
      { name: "روانپزشک", slug: "psychiatrist" },
      { name: "روانشناس", slug: "psychologist" },
      { name: "فیزیوتراپی", slug: "physiotherapy" },
      { name: "کاردرمانی", slug: "occupational-therapy" },
      { name: "گفتاردرمانی", slug: "speech-therapy" },
      { name: "شنوایی سنجی", slug: "audiology" },
      { name: "بینایی سنجی", slug: "optometry" },
      { name: "رادیولوژی", slug: "radiology" },
      { name: "علوم آزمایشگاهی", slug: "laboratory-sciences" },
      { name: "تغذیه و رژیم درمانی", slug: "nutrition-diet" },
      { name: "فوریتهای پزشکی", slug: "emergency-medicine" },
      { name: "پرستاری", slug: "nursing" },
      { name: "خدمات توانبخشی NDIS", slug: "ndis-rehabilitation" },
    ],
  },
  {
    name: "مهندسی",
    icon: "🏗️",
    subCategories: [
      { name: "مهندس عمران و ساختمان", slug: "civil-engineering" },
      { name: "مهندس معماری", slug: "architecture" },
      { name: "مهندس برق", slug: "electrical-engineering" },
      { name: "مهندس کامپیوتر", slug: "computer-engineering" },
      { name: "مهندس صنایع", slug: "industrial-engineering" },
      { name: "مهندس مکانیک", slug: "mechanical-engineering" },
      { name: "مهندس شیمی", slug: "chemical-engineering" },
      { name: "مهندس معدن و مواد", slug: "mining-materials" },
      { name: "مهندس کشاورزی", slug: "agricultural-engineering" },
      { name: "مهندس محیط زیست", slug: "environmental-engineering" },
    ],
  },
  {
    name: "تجارت",
    icon: "💼",
    subCategories: [
      { name: "واردات", slug: "import" },
      { name: "صادرات", slug: "export" },
      { name: "تجارت الکترونیک", slug: "e-commerce" },
      { name: "بازرگانی داخلی", slug: "domestic-trade" },
    ],
  },
  {
    name: "حقوق",
    icon: "⚖️",
    subCategories: [
      { name: "وکلای قضایی", slug: "judicial-lawyers" },
      { name: "وکلای مهاجرت", slug: "immigration-lawyers" },
      { name: "وکلای دانشجویی", slug: "student-lawyers" },
    ],
  },
  {
    name: "خدمات فنی",
    icon: "🔧",
    subCategories: [
      { name: "خدمات بازسازی و نوسازی", slug: "renovation" },
      { name: "خدمات برق و الکتریکی", slug: "electrical-services" },
      { name: "خدمات لوله‌کشی و تأسیسات", slug: "plumbing" },
      { name: "خدمات ایرکاندیشن و تهویه", slug: "air-conditioning" },
      { name: "خدمات نقاشی ساختمان", slug: "house-painting" },
      { name: "خدمات نجاری", slug: "carpentry" },
      { name: "خدمات عایق‌کاری بام", slug: "roof-insulation" },
      { name: "خدمات کشاورزی و باغبانی", slug: "gardening" },
      { name: "خدمات مکانیکی خودرو", slug: "auto-mechanic" },
    ],
  },
  {
    name: "خدمات عمومی",
    icon: "🛠️",
    subCategories: [
      { name: "خدمات املاک", slug: "real-estate" },
      { name: "وسایل نقلیه", slug: "vehicles" },
      { name: "خانه و آشپزخانه", slug: "home-kitchen" },
      { name: "رستوران و کافی‌شاپ", slug: "restaurant-cafe" },
      { name: "نظافت منزل و ساختمان", slug: "cleaning-services" },
      { name: "گردشگری", slug: "tourism" },
      { name: "حمل‌ونقل", slug: "transportation" },
      { name: "آرایشگاه و سالن زیبایی", slug: "beauty-salon" },
      { name: "خشکشویی", slug: "dry-cleaning" },
      { name: "خدمات مجالس", slug: "event-services" },
      { name: "مزون و لباس عروس", slug: "bridal-fashion" },
    ],
  },
  {
    name: "آموزش و مشاوره",
    icon: "📚",
    subCategories: [
      { name: "آموزش دوره‌های تخصصی", slug: "specialized-courses" },
      { name: "آموزش دوره‌های عمومی", slug: "general-courses" },
      { name: "آموزش فنی و حرفه‌ای", slug: "vocational-training" },
      { name: "آموزش هنری و فرهنگی", slug: "art-culture-education" },
      { name: "آموزش زبان‌های خارجی", slug: "language-education" },
      { name: "آموزش ورزشی و فیتنس", slug: "sports-fitness" },
      { name: "مشاوره تحصیلی و مهاجرتی", slug: "education-immigration-consulting" },
      { name: "مشاوره شغلی و مدیریتی", slug: "career-management-consulting" },
      { name: "مشاوره حقوقی و مالی", slug: "legal-financial-consulting" },
      { name: "مشاوره روانشناختی", slug: "psychological-consulting" },
    ],
  },
  {
    name: "طراحی و هنر",
    icon: "🎨",
    subCategories: [
      { name: "طراحی داخلی و دکوراسیون", slug: "interior-design" },
      { name: "طراحی صنعتی", slug: "industrial-design" },
      { name: "طراحی دیجیتال", slug: "digital-design" },
      { name: "گرافیست", slug: "graphic-designer" },
      { name: "نقاش", slug: "painter" },
      { name: "طراح لباس و پارچه", slug: "fashion-textile-design" },
      { name: "عکاسی و تدوین", slug: "photography-editing" },
      { name: "فیلم‌برداری", slug: "videography" },
      { name: "تولید محتوای تخصصی یا تبلیغاتی", slug: "content-production" },
    ],
  },
  {
    name: "فروشگاه‌ها",
    icon: "🏪",
    subCategories: [
      { name: "سوپرمارکت و مواد غذایی", slug: "supermarket-grocery" },
      { name: "فروشگاه‌های تخصصی", slug: "specialty-stores" },
      { name: "صرافی و خدمات مالی", slug: "currency-exchange" },
      { name: "طلافروشی و جواهرات", slug: "jewelry" },
      { name: "متفرقه", slug: "miscellaneous" },
    ],
  },
];

// Australian cities
export const australianCities = [
  { name: "سیدنی", slug: "sydney" },
  { name: "ملبورن", slug: "melbourne" },
  { name: "بریزبن", slug: "brisbane" },
  { name: "پرث", slug: "perth" },
  { name: "آدلاید", slug: "adelaide" },
  { name: "کانبرا", slug: "canberra" },
  { name: "هوبارت", slug: "hobart" },
  { name: "داروین", slug: "darwin" },
  { name: "گلد کوست", slug: "gold-coast" },
  { name: "نیوکاسل", slug: "newcastle" },
  { name: "ولونگونگ", slug: "wollongong" },
  { name: "جیلانگ", slug: "geelong" },
  { name: "تاونزویل", slug: "townsville" },
  { name: "کرنز", slug: "cairns" },
];
