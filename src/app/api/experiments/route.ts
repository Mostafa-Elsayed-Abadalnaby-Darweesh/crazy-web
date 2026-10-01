import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/server/db";
import { toRecord } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

const noDb = () => NextResponse.json({ error: "No database configured. Set DATABASE_URL to enable server persistence." }, { status: 503 });

export async function GET() {
  const db = getPrisma();
  if (!db) return noDb();
  const items = await db.experiment.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, category: true, status: true, thumbnail: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const db = getPrisma();
  if (!db) return noDb();
  try {
    const data = toRecord(await req.json());
    const saved = await db.experiment.create({ data });
    return NextResponse.json({ id: saved.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
