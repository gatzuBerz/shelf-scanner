import { NextRequest, NextResponse } from "next/server";
import { getStockALaDate, getDatesAvecScan } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const stock = getStockALaDate(date);
  const datesAvecScan = getDatesAvecScan();

  return NextResponse.json({ date, stock, datesAvecScan });
}
