import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adId = parseInt(id);
    
    if (!adId) {
      return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
    }

    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        city: true,
        category: true,
        subCategory: true,
        user: {
          select: { username: true, mobile: true }
        }
      }
    });

    if (!ad) {
      return NextResponse.json({ error: "آگهی یافت نشد." }, { status: 404 });
    }

    return NextResponse.json(ad);
  } catch (error) {
    console.error("Ad API Error:", error);
    return NextResponse.json(
      { error: "خطایی در دریافت اطلاعات آگهی رخ داد." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adId = parseInt(id);
    
    if (!adId) {
      return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
    }

    const ad = await prisma.ad.delete({
      where: { id: adId }
    });

    return NextResponse.json({ success: true, ad });
  } catch (error) {
    console.error("Ad Delete API Error:", error);
    return NextResponse.json(
      { error: "خطایی در حذف آگهی رخ داد." },
      { status: 500 }
    );
  }
}
