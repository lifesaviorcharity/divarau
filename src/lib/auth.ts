// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mobile: { label: "شماره موبایل", type: "text" },
        otp: { label: "کد تایید", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.mobile) {
          throw new Error("شماره موبایل الزامی است.");
        }
        // لاگین با هر شماره‌ای موفقیت‌آمیز است
        return {
          id: "1",
          mobile: credentials.mobile,
          name: "کاربر تستی",
          role: credentials.mobile.includes("admin") ? "ADMIN" : "USER",
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
        token.mobile = (user as any).mobile;
        token.name = user.name;
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
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "mock-secret-key-123456",
  pages: { signIn: "/auth/login" }
};
