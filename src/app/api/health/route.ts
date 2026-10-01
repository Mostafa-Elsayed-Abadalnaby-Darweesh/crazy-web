import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getPrisma();
  if (!db) return NextResponse.json({ ok: true, database: false });
  try {
    const experiments = await db.experiment.count();
    return NextResponse.json({ ok: true, database: true, experiments });
  } catch (e) {
    return NextResponse.json({ ok: false, database: false, error: (e as Error).message }, { status: 500 });
  }
}
