import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const file = formData.get("image") as File | null;
    const link = formData.get("link") as string || "";
    const position = parseInt(formData.get("position") as string || "1");
    const displayDuration = parseInt(formData.get("displayDuration") as string || "5");
    const durationDays = parseInt(formData.get("durationDays") as string || "30");

    if (!file) {
      return NextResponse.json(
        { error: "تصویر بنر الزامی است." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads/banners");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // ignore if directory exists
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + "-" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);
    const imageUrl = `/uploads/banners/${filename}`;

    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const newBanner = await prisma.banner.create({
      data: {
        imageUrl,
        link,
        position,
        displayDuration,
        durationDays,
        expiresAt,
        isActive: true,
      }
    });

    return NextResponse.json(newBanner, { status: 201 });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { error: "خطایی در ثبت بنر رخ داد." },
      { status: 500 }
    );
  }
}
