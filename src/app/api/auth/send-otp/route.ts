// src/app/api/auth/send-otp/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "کد تایید ۱۱۱۱۱۱ ارسال شد (محیط تستی)"
  });
}
