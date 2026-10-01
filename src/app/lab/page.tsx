"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLab } from "@/store/labStore";
import { useSettings } from "@/store/settingsStore";
import { Workspace } from "@/components/lab/Workspace";
import { canvasApi } from "@/lib/canvasRegistry";

function NewLab() {
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const s = useLab.getState();
    const prefs = useSettings.getState().preferences;
    const template = params.get("template");
    const mode = params.get("mode") === "physics" ? "physics" : "chemistry";
    if (template) {
      s.loadTemplate(template);
      s.requestFit();
    }
    else s.newExperiment(mode);
    s.setSettings({ showGrid: prefs.showGrid, snapToGrid: prefs.snapToGrid, showRulers: prefs.showRulers });
    s.setSpeed(prefs.simSpeed);
    s.setEnv({ gravity: prefs.gravity, ambientTemperature: prefs.ambientTemperature });
    if (!template) s.setLogInterval(prefs.logInterval);
    const add = params.get("add");
    setReady(true);
    setTimeout(() => {
      if (add) {
        const c = canvasApi()?.center();
        if (c) useLab.getState().addComponent(add, c);
      }
    }, 300);
  }, [params]);
  return ready ? <Workspace /> : null;
}

export default function LabPage() {
  return (
    <Suspense>
      <NewLab />
    </Suspense>
  );
}
