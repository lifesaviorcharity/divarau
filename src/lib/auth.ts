import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { checkVerificationCode } from "@/lib/twilio";
import { normalizeAustralianMobile } from "@/lib/utils";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mobile: { label: "شماره موبایل", type: "text", placeholder: "04XX XXX XXX" },
        otp: { label: "کد تایید", type: "text", placeholder: "123456" }
      },
      async authorize(credentials) {
        if (!credentials?.mobile || !credentials?.otp) {
          throw new Error("شماره موبایل و کد تأیید الزامی است.");
        }

        // Normalize the mobile number to E.164 format
        let normalizedMobile: string;
        try {
          normalizedMobile = normalizeAustralianMobile(credentials.mobile);
        } catch {
          throw new Error("شماره موبایل نامعتبر است.");
        }

        // Verify OTP via Twilio Verify
        const verifyResult = await checkVerificationCode(
          normalizedMobile,
          credentials.otp
        );

        if (!verifyResult.success) {
          throw new Error(verifyResult.error || "کد تأیید نامعتبر است.");
        }

        // Find the user or create a new one (unified register/login)
        let user = await prisma.user.findUnique({
          where: { mobile: normalizedMobile },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              mobile: normalizedMobile,
              isActive: true,
              role: "USER",
            },
          });
        }

        if (!user.isActive) {
          throw new Error("حساب کاربری شما غیرفعال شده است.");
        }

        return {
          id: user.id.toString(),
          mobile: user.mobile,
          name: user.username || user.mobile,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return url;
      try {
        const parsed = new URL(url);
        if (typeof window !== "undefined") {
          if (parsed.origin === window.location.origin) return url;
        }
        return parsed.pathname + parsed.search + parsed.hash;
      } catch {
        return "/";
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mobile = user.mobile;
        token.name = user.name || user.mobile;
        token.lastVerifiedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.mobile = token.mobile as string;
        session.user.name = token.name as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    // 30-day session — users stay logged in without needing SMS again
    maxAge: 30 * 24 * 60 * 60,
    // Refresh the token on every request to extend expiry from last activity
    updateAge: 24 * 60 * 60, // refresh once per day
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
};
