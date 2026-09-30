import type { Prisma } from "@prisma/client";

type Json = Prisma.InputJsonValue;

/** Minimal structural validation of an experiment document before persisting it. */
export function toRecord(body: unknown) {
  const e = body as Record<string, unknown>;
  if (!e || typeof e !== "object") throw new Error("Body must be an experiment object");
  if (typeof e.id !== "string" || typeof e.title !== "string") throw new Error("id and title are required");
  if (e.category !== "chemistry" && e.category !== "physics") throw new Error("category must be chemistry or physics");
  const arr = (k: string) => (Array.isArray(e[k]) ? (e[k] as Json) : ([] as Json));
  const obj = (k: string) => (e[k] && typeof e[k] === "object" ? (e[k] as Json) : ({} as Json));
  return {
    id: e.id,
    title: e.title.slice(0, 300),
    category: e.category,
    status: e.status === "completed" ? "completed" : "draft",
    workspaceState: obj("workspaceState"),
    components: arr("components"),
    wires: arr("wires"),
    chemicals: arr("chemicals"),
    measurements: arr("measurements"),
    dataRows: arr("dataRows"),
    timeline: arr("timeline"),
    observations: arr("observations"),
    charts: arr("charts"),
    notebook: obj("notebook"),
    report: obj("report"),
    recording: arr("recording"),
    thumbnail: typeof e.thumbnail === "string" ? e.thumbnail : null,
  };
}
