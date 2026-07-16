import { NextResponse } from "next/server";
import { getMissionDashboard, markWorkedToday } from "@/lib/mission-control/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getMissionDashboard();
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
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    if (body.action === "checkin") {
      const meta = await markWorkedToday();
      const data = await getMissionDashboard();
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
