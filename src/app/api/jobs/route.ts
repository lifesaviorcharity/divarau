import { NextResponse } from "next/server";

const mockJobs = [
  {
    id: 1,
    title: "رستوران پرشین پلاس",
    description: "بهترین غذاهای سنتی ایرانی با کادری مجرب در مرکز سیدنی",
    status: "FINAL",
    isVip: true,
    isBoosted: false,
    categoryId: 1,
    category: { name: "رستوران و کافه" },
    cityId: 1,
    city: { name: "سیدنی" },
    phone: "+61 412 345 678",
    phones: ["+61 412 345 678", "+61 498 765 432"],
    address: "George St, Sydney NSW 2000",
    website: "https://example.com",
    images: [{ url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" }],
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "خدمات ساختمانی و بازسازی آریا",
    description: "کلیه خدمات نقاشی، بازسازی منازل و تاسیسات با گارانتی",
    status: "FINAL",
    isVip: false,
    isBoosted: true,
    boostPeriod: "THREE_DAYS",
    categoryId: 2,
    category: { name: "خدمات ساختمانی" },
    cityId: 2,
    city: { name: "ملبورن" },
    phone: "+61 422 222 333",
    images: [{ url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600" }],
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  return NextResponse.json(mockJobs);
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({
    success: true,
    message: "شغل با موفقیت به صورت آزمایشی ثبت شد.",
    job: { id: Date.now(), ...body, status: "PENDING" }
  });
}
