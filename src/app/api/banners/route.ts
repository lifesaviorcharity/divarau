import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      id: 1,
      title: "صرافی تستی",
      imageDesktop: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200",
      imageMobile: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600",
      link: "https://google.com"
    }
  ]);
}
