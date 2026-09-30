import type { DataColumn, DataRow } from "./types";
import type { LiveReading } from "./simulation";
import { getDefinition } from "./registry";

/** Readings that go into the automatic data log (sensors, flagged readings, optics). */
export function loggableReadings(readings: LiveReading[], componentTypes: Map<string, string>): LiveReading[] {
  return readings.filter((r) => {
    if (r.reading.log) return true;
    const type = componentTypes.get(r.componentId);
    const def = type ? getDefinition(type) : undefined;
    return def?.roles.includes("sensor") || def?.roles.includes("optical");
  });
}

/** Column id for a reading: the plain key when unique, otherwise key@component. */
export function columnIds(readings: LiveReading[]): Map<LiveReading, string> {
  const count = new Map<string, number>();
  for (const r of readings) count.set(r.reading.key, (count.get(r.reading.key) ?? 0) + 1);
  const seen = new Map<string, number>();
  const out = new Map<LiveReading, string>();
  for (const r of readings) {
    const k = r.reading.key;
    if ((count.get(k) ?? 0) <= 1) out.set(r, k);
    else {
      const n = (seen.get(k) ?? 0) + 1;
      seen.set(k, n);
      out.set(r, n === 1 ? k : `${k}@${r.source}`);
    }
  }
  return out;
}

const PRETTY: Record<string, string> = { ph: "pH", t: "Time" };

export function labelFor(id: string, meta: Record<string, { label: string; unit: string }>): DataColumn {
  if (id === "t") return { id, label: "Time", unit: "s" };
  const m = meta[id];
  if (m) return { id, label: m.label, unit: m.unit };
  const [key, source] = id.split("@");
  const base = PRETTY[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
  return { id, label: source ? `${base} (${source})` : base, unit: "" };
}

export function deriveColumns(rows: DataRow[], meta: Record<string, { label: string; unit: string }>): DataColumn[] {
  const ids = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r.values)) ids.add(k);
  for (const k of Object.keys(meta)) ids.add(k);
  return [labelFor("t", meta), ...[...ids].filter((i) => i !== "t").map((id) => labelFor(id, meta))];
}
