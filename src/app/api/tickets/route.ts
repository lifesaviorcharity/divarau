import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { subject, message } = await req.json();
  return NextResponse.json({
    success: true,
    ticket: {
      id: Date.now(),
      subject,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      messages: [{ id: Date.now(), content: message, isAdmin: false, createdAt: new Date().toISOString() }]
    }
  });
}
