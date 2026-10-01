import type { DataColumn, DataRow } from "@/lib/engine/types";

export function download(filename: string, content: string | Blob, mime = "text/plain") {
  const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(rows: DataRow[], columns: DataColumn[]): string {
  const header = [...columns.map((c) => (c.unit ? `${c.label} (${c.unit})` : c.label)), "Observation"];
  const lines = rows.map((r) => [...columns.map((c) => (c.id === "t" ? r.t : r.values[c.id] ?? "")), r.observation ?? ""].map(esc).join(","));
  return [header.map(esc).join(","), ...lines].join("\n");
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "experiment";
