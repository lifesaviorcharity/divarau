import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "مشاغل ایرانیان و فارسی‌زبانان استرالیا | AUIR",
  description:
    "پل ارتباطی مؤثر میان ایرانیان مقیم استرالیا و کسب‌وکارهای ایرانی فعال در این کشور. پیدا کن، معرفی شو، ارتباط بگیر!",
  keywords: [
    "مشاغل ایرانیان استرالیا",
    "Iranian businesses Australia",
    "AUIR",
    "بانک مشاغل",
    "آگهی استخدام",
    "ایرانیان سیدنی",
    "ایرانیان ملبورن",
  ],
  openGraph: {
    title: "مشاغل ایرانیان و فارسی‌زبانان استرالیا",
    description: "پیدا کن، معرفی شو، ارتباط بگیر!",
    type: "website",
    locale: "fa_IR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
