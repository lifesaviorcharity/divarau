import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    username: "محسن احمدی",
    mobile: "+61412345678",
    email: "user@example.com",
    jobs: [
      {
        id: 1,
        title: "رستوران سنتی زعفران",
        status: "FINAL",
        isVip: false,
        isBoosted: false,
        city: { name: "سیدنی" },
        images: [{ url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" }]
      },
      {
        id: 2,
        title: "دفتر ترجمه و مهاجرت آریا",
        status: "APPROVED",
        isVip: false,
        isBoosted: false,
        city: { name: "ملبورن" },
        images: []
      }
    ],
    ads: [
      {
        id: 10,
        title: "نیازمند باریستا با سابقه کاری",
        type: "EMPLOYMENT",
        status: "FINAL",
        phone: "+61400111222"
      }
    ],
    messages: [
      {
        id: 1,
        title: "خوش‌آمدگویی به دیوار استرالیا",
        content: "حساب کاربری شما با موفقیت فعال گردید.",
        isRead: true,
        createdAt: new Date().toISOString()
      }
    ],
    tickets: [
      {
        id: 101,
        subject: "سوال درباره ارتقا به ویژه",
        status: "REPLIED",
        createdAt: new Date().toISOString(),
        messages: [
          { id: 1, content: "سلام، هزینه اشتراک ویژه چقدر است؟", isAdmin: false, createdAt: new Date().toISOString() },
          { id: 2, content: "با سلام، هزینه ارتقا ۳۰ دلار است.", isAdmin: true, createdAt: new Date().toISOString() }
        ]
      }
    ]
  });
}
