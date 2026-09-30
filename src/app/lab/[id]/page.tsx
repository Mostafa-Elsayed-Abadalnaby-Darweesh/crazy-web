"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useLab } from "@/store/labStore";
import { getExperiment } from "@/lib/storage/experiments";
import { Workspace } from "@/components/lab/Workspace";

export default function LabById({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  useEffect(() => {
    const current = useLab.getState();
    if (current.experimentId === id && current.components.length) {
      setState("ready");
      return;
    }
    const e = getExperiment(id);
    if (!e) return setState("missing");
    current.loadExperiment(e);
    current.requestFit();
    setState("ready");
  }, [id]);
  if (state === "missing")
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <div className="text-lg font-semibold">Experiment not found</div>
        <p className="text-sm text-slate-500">It may have been deleted or saved in another browser.</p>
        <Link href="/experiments" className="btn btn-primary">
          Back to my experiments
        </Link>
      </div>
    );
  return state === "ready" ? <Workspace /> : null;
}
