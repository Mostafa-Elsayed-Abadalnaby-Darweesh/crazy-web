"use client";
import type { Experiment } from "@/lib/engine/types";

const KEY = "vlab.experiments.v1";

function readAll(): Record<string, Experiment> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Experiment>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, Experiment>): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    // Quota exceeded: drop heavy fields (recordings, thumbnails of older experiments) and retry
    const slim = Object.fromEntries(
      Object.entries(all).map(([id, e]) => [id, { ...e, recording: e.recording.slice(-40) }]),
    );
    try {
      localStorage.setItem(KEY, JSON.stringify(slim));
      return true;
    } catch {
      return false;
    }
  }
}

export function listExperiments(): Experiment[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getExperiment(id: string): Experiment | undefined {
  return readAll()[id];
}

export function saveExperiment(exp: Experiment): boolean {
  const all = readAll();
  all[exp.id] = exp;
  const ok = writeAll(all);
  if (ok) window.dispatchEvent(new CustomEvent("vlab:experiments-changed"));
  void syncToServer(exp);
  return ok;
}

export function deleteExperiment(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
  window.dispatchEvent(new CustomEvent("vlab:experiments-changed"));
  if (cloudEnabled()) void fetch(`/api/experiments/${id}`, { method: "DELETE" }).catch(() => undefined);
}

export function duplicateExperiment(id: string, newId: string): Experiment | undefined {
  const src = getExperiment(id);
  if (!src) return;
  const now = Date.now();
  const copy: Experiment = { ...structuredClone(src), id: newId, title: `${src.title} (copy)`, status: "draft", createdAt: now, updatedAt: now };
  saveExperiment(copy);
  return copy;
}

function cloudEnabled(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem("vlab.settings") ?? "{}");
    return Boolean(s?.state?.preferences?.cloudSync);
  } catch {
    return false;
  }
}

/** Optional server persistence (Prisma + PostgreSQL) when enabled in Settings. */
async function syncToServer(exp: Experiment) {
  if (!cloudEnabled()) return;
  try {
    await fetch(`/api/experiments/${exp.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exp) });
  } catch {
    /* offline — local copy is authoritative */
  }
}
