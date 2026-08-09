import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({
    id: Number(id),
    title: "رستوران پرشین پلاس",
    description: "بهترین غذاهای سنتی ایرانی در مرکز سیدنی با سابقه درخشان",
    status: "FINAL",
    isVip: true,
    isBoosted: true,
    phone: "+61 412 345 678",
    phones: ["+61 412 345 678"],
    address: "Sydney NSW 2000",
    workHours: "همه روزه از ۱۱:۰۰ تا ۲۳:۰۰",
    email: "info@persianplus.com.au",
    website: "https://example.com",
    telegram: "persianplus",
    instagram: "persianplus_au",
    whatsapp: "+61412345678",
    category: { name: "رستوران و کافه" },
    city: { name: "سیدنی" },
    images: [{ url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800" }]
  });
}
