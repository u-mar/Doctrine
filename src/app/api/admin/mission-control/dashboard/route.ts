import { NextResponse } from "next/server";
import { getMissionDashboard, markWorkedToday } from "@/lib/mission-control/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const data = await getMissionDashboard({ from, to });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      from?: string;
      to?: string;
    };
    if (body.action === "checkin") {
      const meta = await markWorkedToday();
      const data = await getMissionDashboard({ from: body.from, to: body.to });
      return NextResponse.json({ ...data, meta });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
