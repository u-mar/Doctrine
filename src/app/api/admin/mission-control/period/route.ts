import { NextResponse } from "next/server";
import { getMonthReport, getYearReport } from "@/lib/mission-control/period-report";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: "Invalid month key" }, { status: 400 });
      }
      return NextResponse.json(await getMonthReport(month));
    }
    if (year) {
      if (!/^\d{4}$/.test(year)) {
        return NextResponse.json({ error: "Invalid year key" }, { status: 400 });
      }
      return NextResponse.json(await getYearReport(year));
    }
    return NextResponse.json({ error: "Provide month=YYYY-MM or year=YYYY" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load report" },
      { status: 500 }
    );
  }
}
