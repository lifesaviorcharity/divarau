import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    priceMonth1: "15",
    priceMonth3: "40",
    priceMonth6: "75",
    priceMonth12: "130",
    priceVip: "30",
    priceBoost1: "10",
    priceBoost3: "25",
    priceBoost7: "50",
    termsText: "قوانین و مقررات ثبت آگهی و مشاغل...",
    siteTitle: "دیوار استرالیا"
  });
}
