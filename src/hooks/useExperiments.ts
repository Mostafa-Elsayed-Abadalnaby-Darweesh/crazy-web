"use client";
import { useEffect, useState } from "react";
import type { Experiment } from "@/lib/engine/types";
import { listExperiments } from "@/lib/storage/experiments";

export function useExperiments() {
  const [items, setItems] = useState<Experiment[] | null>(null);
  useEffect(() => {
    const load = () => setItems(listExperiments());
    load();
    window.addEventListener("vlab:experiments-changed", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("vlab:experiments-changed", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return items;
}

export function timeAgo(ts: number) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(ts).toLocaleDateString();
}
