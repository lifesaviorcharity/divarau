import { NextResponse } from "next/server";

const mockCities = [
  { id: 1, name: "سیدنی", state: "NSW", slug: "sydney" },
  { id: 2, name: "ملبورن", state: "VIC", slug: "melbourne" },
  { id: 3, name: "بریزبن", state: "QLD", slug: "brisbane" },
  { id: 4, name: "پرت", state: "WA", slug: "perth" },
  { id: 5, name: "آدلاید", state: "SA", slug: "adelaide" }
];

export async function GET() {
  return NextResponse.json(mockCities);
}
