import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function handler(req: Request, ctx: any) {
  let maxAgeDays = 30;
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "sessionDuration" }
    });
    if (setting?.value) {
      const parsed = parseInt(setting.value);
      if (!isNaN(parsed) && parsed > 0) {
        maxAgeDays = parsed;
      }
    }
  } catch (error) {
    console.error("Failed to fetch sessionDuration:", error);
  }

  const dynamicOptions = {
    ...authOptions,
    session: {
      ...authOptions.session,
      maxAge: maxAgeDays * 24 * 60 * 60,
    }
  };

  return NextAuth(dynamicOptions)(req, ctx);
}

export { handler as GET, handler as POST };
