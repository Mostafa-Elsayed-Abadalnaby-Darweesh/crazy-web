import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/server/db";
import { toRecord } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

const noDb = () => NextResponse.json({ error: "No database configured. Set DATABASE_URL to enable server persistence." }, { status: 503 });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getPrisma();
  if (!db) return noDb();
  const { id } = await params;
  const e = await db.experiment.findUnique({ where: { id } });
  return e ? NextResponse.json(e) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getPrisma();
  if (!db) return noDb();
  const { id } = await params;
  try {
    const data = toRecord({ ...(await req.json()), id });
    const saved = await db.experiment.upsert({ where: { id }, create: data, update: data });
    return NextResponse.json({ id: saved.id, updatedAt: saved.updatedAt });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getPrisma();
  if (!db) return noDb();
  const { id } = await params;
  await db.experiment.delete({ where: { id } }).catch(() => null);
  return new NextResponse(null, { status: 204 });
}
