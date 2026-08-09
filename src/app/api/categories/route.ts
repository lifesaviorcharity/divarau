import { NextResponse } from "next/server";

const mockCategories = [
  {
    id: 1,
    name: "رستوران و کافه",
    slug: "restaurants",
    icon: "Utensils",
    subCategories: [
      { id: 101, name: "رستوران سنتی", slug: "traditional" },
      { id: 102, name: "فست‌فود و پیتزا", slug: "fastfood" }
    ]
  },
  {
    id: 2,
    name: "خدمات ساختمانی",
    slug: "construction",
    icon: "Hammer",
    subCategories: [
      { id: 201, name: "نقاشی و بازسازی", slug: "painting" },
      { id: 202, name: "لوله کشی و تاسیسات", slug: "plumbing" }
    ]
  },
  {
    id: 3,
    name: "امور مالی و صرافی",
    slug: "finance",
    icon: "Coins",
    subCategories: [
      { id: 301, name: "صرافی و انتقال پول", slug: "exchange" },
      { id: 302, name: "حسابداری و مالیات", slug: "tax-accounting" }
    ]
  }
];

export async function GET() {
  return NextResponse.json(mockCategories);
}
