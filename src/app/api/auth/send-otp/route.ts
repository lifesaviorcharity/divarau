import { NextResponse } from "next/server";
import { sendVerificationCode } from "@/lib/twilio";
import { normalizeAustralianMobile, isValidAustralianMobile } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { mobile } = await request.json();

    if (!mobile || !isValidAustralianMobile(mobile)) {
      return NextResponse.json(
        { error: "لطفاً یک شماره موبایل استرالیایی معتبر وارد کنید." },
        { status: 400 }
      );
    }

    // Normalize to E.164 format for Twilio
    const normalizedMobile = normalizeAustralianMobile(mobile);

    // Send verification via Twilio Verify
    const result = await sendVerificationCode(normalizedMobile);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "کد تأیید ارسال شد.",
      });
    }

    return NextResponse.json(
      { error: result.error || "خطایی در ارسال کد تأیید رخ داد." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { error: "خطایی در ارسال کد تأیید رخ داد." },
      { status: 500 }
    );
  }
}
