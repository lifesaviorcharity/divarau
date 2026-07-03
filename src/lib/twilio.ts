import twilio from "twilio";

let client: twilio.Twilio | null = null;

function getTwilioClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials are not set in environment variables");
    }
    client = twilio(accountSid, authToken);
  }
  return client;
}

export type VerifyResult = {
  success: boolean;
  error?: string;
};

/**
 * Send a verification code via SMS using Twilio Verify.
 * Twilio generates the code and manages expiry/rate limits automatically.
 */
export async function sendVerificationCode(
  mobile: string
): Promise<VerifyResult> {
  // Bypass Twilio in development environment unless USE_REAL_OTP is set
  if (process.env.NODE_ENV === "development" && process.env.USE_REAL_OTP !== "true") {
    console.log(`[DEV BYPASS] Mock OTP sent to ${mobile}. Use 123456 to login.`);
    return { success: true };
  }

  try {
    const twilioClient = getTwilioClient();
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!verifyServiceSid) {
      throw new Error("TWILIO_VERIFY_SERVICE_SID is not set");
    }

    const verification = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: mobile,
        channel: "sms",
      });

    if (verification.status === "pending") {
      return { success: true };
    }

    return { success: false, error: "خطا در ارسال کد تأیید." };
  } catch (error: any) {
    console.error("Twilio Send Error:", error);

    // Handle specific Twilio errors
    if (error && typeof error === "object" && "code" in error) {
      const twilioError = error as { code: number; message: string };
      
      // Max send attempts reached
      if (twilioError.code === 60203) {
        return {
          success: false,
          error: "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید.",
        };
      }

      // Invalid phone number
      if (twilioError.code === 60200) {
        return {
          success: false,
          error: "شماره موبایل نامعتبر است.",
        };
      }
      
      // Unverified number (Trial account)
      if (twilioError.code === 21608 || twilioError.message?.includes("unverified")) {
        return {
          success: false,
          error: "حساب Twilio شما آزمایشی است و امکان ارسال پیامک فقط به شماره‌های تأیید شده در Twilio وجود دارد.",
        };
      }

      return {
        success: false,
        error: twilioError.message || "خطا در ارسال کد تأیید. لطفاً دوباره تلاش کنید.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "خطا در ارتباط با سرور پیامک.",
    };
  }
}

/**
 * Check a verification code against Twilio Verify.
 * Returns success if the code matches.
 */
export async function checkVerificationCode(
  mobile: string,
  code: string
): Promise<VerifyResult> {
  // Bypass Twilio in development environment unless USE_REAL_OTP is set
  if (process.env.NODE_ENV === "development" && process.env.USE_REAL_OTP !== "true") {
    console.log(`[DEV BYPASS] Verifying mock OTP ${code} for ${mobile}`);
    if (code === "123456") return { success: true };
    return { success: false, error: "کد تأیید نامعتبر است (برای محیط توسعه از 123456 استفاده کنید)." };
  }

  try {
    const twilioClient = getTwilioClient();
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!verifyServiceSid) {
      throw new Error("TWILIO_VERIFY_SERVICE_SID is not set");
    }

    const verificationCheck = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: mobile,
        code,
      });

    if (verificationCheck.status === "approved") {
      return { success: true };
    }

    return { success: false, error: "کد تأیید نامعتبر است." };
  } catch (error: unknown) {
    console.error("Twilio Check Error:", error);

    if (error && typeof error === "object" && "code" in error) {
      const twilioError = error as { code: number; message: string };

      // Max check attempts reached
      if (twilioError.code === 60202) {
        return {
          success: false,
          error: "تعداد تلاش‌ها بیش از حد مجاز. لطفاً کد جدید درخواست کنید.",
        };
      }

      // Verification not found / expired
      if (twilioError.code === 20404) {
        return {
          success: false,
          error: "کد تأیید منقضی شده است. لطفاً کد جدید درخواست کنید.",
        };
      }
    }

    return {
      success: false,
      error: "خطا در بررسی کد تأیید. لطفاً دوباره تلاش کنید.",
    };
  }
}

/**
 * Send a custom SMS message.
 */
export async function sendMessage(mobile: string, body: string): Promise<boolean> {
  if (process.env.NODE_ENV === "development" && process.env.USE_REAL_OTP !== "true") {
    console.log(`[DEV BYPASS] SMS to ${mobile}:\n${body}`);
    return true;
  }

  try {
    const twilioClient = getTwilioClient();
    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile,
    });
    return true;
  } catch (error) {
    console.error("Twilio sendMessage Error:", error);
    return false;
  }
}
