"use client";
import { useState } from "react";
import { Cloud, Database, Trash2, Upload, User } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { useSettings, type Preferences, type Profile } from "@/store/settingsStore";
import { listExperiments } from "@/lib/storage/experiments";
import { download } from "@/lib/export";

function Card({ title, icon: Icon, children, desc }: { title: string; icon: typeof User; children: React.ReactNode; desc?: string }) {
  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {desc && <p className="-mt-2 mb-4 text-sm text-slate-500">{desc}</p>}
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { profile, preferences, setProfile, setPreferences } = useSettings();
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const text = (k: keyof Profile, label: string) => (
    <label>
      <span className="label">{label}</span>
      <input className="input" value={String(profile[k] ?? "")} onChange={(e) => setProfile({ [k]: e.target.value })} />
    </label>
  );
  const toggle = (k: keyof Preferences, label: string, hint: string) => (
    <label className="flex items-start justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="text-xs text-slate-500">{hint}</span>
      </span>
      <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={Boolean(preferences[k])} onChange={(e) => setPreferences({ [k]: e.target.checked })} />
    </label>
  );
  const num = (k: keyof Preferences, label: string, unit: string, step = 0.1) => (
    <label>
      <span className="label">{label}</span>
      <div className="flex items-center gap-2">
        <input type="number" step={step} className="input" value={Number(preferences[k])} onChange={(e) => setPreferences({ [k]: Number(e.target.value) })} />
        <span className="w-14 text-xs text-slate-500">{unit}</span>
      </div>
    </label>
  );

  return (
    <PageShell title="Settings" subtitle="Profile, report defaults, workspace preferences and data management.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile & report defaults" icon={User} desc="Used to pre-fill the title page of generated reports.">
          <div className="grid gap-3 sm:grid-cols-2">
            {text("name", "Student name")}
            {text("studentId", "Student ID")}
            {text("email", "Email")}
            {text("institution", "Institution")}
            {text("course", "Course")}
            {text("instructor", "Instructor")}
          </div>
          <div className="mt-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {profile.logo && <img src={profile.logo} alt="Logo" className="h-12 w-12 rounded border border-slate-200 object-contain" />}
            <label className="btn btn-sm cursor-pointer">
              <Upload size={12} /> {profile.logo ? "Replace logo" : "Upload institution logo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => setProfile({ logo: String(r.result) });
                  r.readAsDataURL(f);
                }}
              />
            </label>
            {profile.logo && (
              <button className="btn btn-ghost btn-sm" onClick={() => setProfile({ logo: undefined })}>
                Remove
              </button>
            )}
          </div>
        </Card>

        <Card title="Workspace & simulation" icon={Database}>
          <div className="divide-y divide-slate-100">
            {toggle("autosave", "Autosave", "Save the open experiment every 30 seconds after its first manual save.")}
            {toggle("showGrid", "Show grid by default", "Display the measurement grid on new workbenches.")}
            {toggle("snapToGrid", "Snap to grid", "Align dropped and moved objects to the grid.")}
            {toggle("showRulers", "Show rulers", "Millimetre rulers along the canvas edges.")}
            {toggle("confirmDelete", "Confirm before deleting experiments", "Ask before removing saved experiments.")}
            {toggle("sound", "Lab sounds", "Fizzing, burner roar, hydrogen pops, boiling, sparks and other effects.")}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {num("logInterval", "Default logging interval", "seconds")}
            {num("simSpeed", "Default simulation speed", "×", 0.25)}
            {num("ambientTemperature", "Ambient temperature", "°C", 1)}
            {num("gravity", "Gravitational field", "m/s²", 0.01)}
            {num("soundVolume", "Sound volume", "0 – 1", 0.1)}
          </div>
        </Card>

        <Card title="Cloud sync (PostgreSQL)" icon={Cloud} desc="Experiments are always stored in this browser. When the server has DATABASE_URL configured, enable sync to also persist them via the Prisma API.">
          {toggle("cloudSync", "Sync experiments to the server", "Sends each saved experiment to /api/experiments.")}
          <div className="mt-3 flex items-center gap-2">
            <button
              className="btn btn-sm"
              onClick={async () => {
                setServerStatus("Checking…");
                try {
                  const r = await fetch("/api/health");
                  const j = await r.json();
                  setServerStatus(j.database ? `Connected · database ready (${j.experiments ?? 0} experiments)` : "Server reachable · no database configured (local mode)");
                } catch {
                  setServerStatus("Server unreachable");
                }
              }}
            >
              Test connection
            </button>
            {serverStatus && <span className="text-xs text-slate-500">{serverStatus}</span>}
          </div>
        </Card>

        <Card title="Data" icon={Trash2}>
          <p className="mb-3 text-sm text-slate-500">Export every experiment as structured JSON, or clear local storage.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => download("virtual-lab-experiments.json", JSON.stringify(listExperiments(), null, 2), "application/json")}>
              Export all experiments
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirm("Delete all locally saved experiments? This cannot be undone.")) {
                  localStorage.removeItem("vlab.experiments.v1");
                  window.dispatchEvent(new CustomEvent("vlab:experiments-changed"));
                }
              }}
            >
              Clear local experiments
            </button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
