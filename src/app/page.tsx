import Link from "next/link";
import { ArrowRight, Atom, BarChart3, BookOpen, FileText, FlaskConical, MousePointerClick, ShieldCheck, Sparkles, Timer, Zap, Clapperboard } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SiteFooter } from "@/components/layout/Footer";
import { TEMPLATES } from "@/lib/templates";

const FEATURES = [
  { icon: MousePointerClick, title: "Drag-and-drop workbench", text: "Figma-style canvas with zoom, pan, snapping, rulers, multi-select, grouping, locking and full undo/redo." },
  { icon: FlaskConical, title: "Real chemistry engine", text: "Stoichiometric reactions, pH, indicators, precipitates, gas evolution, heating and titrations — computed, not scripted." },
  { icon: Zap, title: "Physics simulators", text: "Live circuit solver, pendulums, springs, inclined planes, free fall and ray-traced optics with lenses and prisms." },
  { icon: BarChart3, title: "Data & charts", text: "Automatic data logging, editable tables, CSV export and live line, bar, scatter and area charts." },
  { icon: BookOpen, title: "Lab notebook", text: "Structured notebook sections that auto-fill from what actually happened during the experiment." },
  { icon: FileText, title: "PDF reports", text: "One click turns your experiment into a formatted academic report with snapshots, tables and charts." },
  { icon: Clapperboard, title: "Session recording", text: "Record every action and measurement, then replay the experiment step by step." },
  { icon: ShieldCheck, title: "Safety system", text: "Hazard levels, PPE recommendations and warnings for dangerous combinations — safely virtual." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-primary">Features</a>
            <a href="#templates" className="hover:text-primary">Templates</a>
            <Link href="/help" className="hover:text-primary">Help</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="btn">Dashboard</Link>
            <Link href="/lab" className="btn btn-primary">Open the lab</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <span className="chip border-primary-100 bg-primary-50 text-primary">
              <Sparkles size={12} /> Interactive science simulator
            </span>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.08] tracking-tight text-ink">
              A real laboratory,
              <br />
              <span className="text-primary">right in your browser.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Virtual Lab lets students, teachers and researchers build chemistry and physics experiments by dragging equipment onto a workbench, running realistic simulations, recording data and generating professional reports.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/lab?template=acid-base-titration" className="btn btn-primary px-5 py-2.5 text-[15px]">
                <FlaskConical size={17} /> Try a titration <ArrowRight size={15} />
              </Link>
              <Link href="/lab?template=ohms-law" className="btn px-5 py-2.5 text-[15px]">
                <Atom size={17} /> Build a circuit
              </Link>
            </div>
            <div className="mt-8 flex gap-8 text-sm text-slate-500">
              <div>
                <div className="text-2xl font-semibold text-ink">75+</div>components
              </div>
              <div>
                <div className="text-2xl font-semibold text-ink">60+</div>chemicals
              </div>
              <div>
                <div className="text-2xl font-semibold text-ink">118</div>elements
              </div>
              <div>
                <div className="text-2xl font-semibold text-ink">{TEMPLATES.length}</div>templates
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="panel overflow-hidden shadow-float">
              <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="ml-3 text-xs text-slate-500">Acid–Base Titration · Virtual Lab</span>
              </div>
              <HeroIllustration />
            </div>
            <div className="panel absolute -bottom-6 -left-6 hidden w-56 p-3 shadow-float md:block">
              <div className="section-title">Reaction</div>
              <div className="mt-1 font-mono text-[13px] font-semibold">NaOH + HCl → NaCl + H₂O</div>
              <div className="mt-1 text-[11px] text-slate-500">Neutralisation · ΔT +0.9 °C · pH 7.0</div>
            </div>
            <div className="panel absolute -right-4 -top-5 hidden items-center gap-2 p-2.5 shadow-float md:flex">
              <Timer size={16} className="text-secondary" />
              <span className="font-mono text-xs">00:40 — pH reached 7.0</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight">Everything a lab needs</h2>
        <p className="mt-2 max-w-2xl text-slate-600">Workspace, simulator, notebook, analysis dashboard and report generator in one engineering-grade application.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
                <f.icon size={18} />
              </span>
              <div className="mt-3 text-sm font-semibold">{f.title}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="templates" className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Start from a template</h2>
              <p className="mt-2 text-slate-600">Ready-made experiments place every component on the bench for you.</p>
            </div>
            <Link href="/templates" className="btn">
              All templates <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.slice(0, 8).map((t) => (
              <Link key={t.id} href={`/lab?template=${t.id}`} className="panel flex items-center gap-3 p-4 hover:border-primary/40">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.category === "chemistry" ? "bg-primary-50 text-primary" : "bg-secondary-50 text-secondary-600"}`}>
                  {t.category === "chemistry" ? <FlaskConical size={17} /> : <Atom size={17} />}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.topic}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Ready to experiment?</h2>
        <p className="mt-3 text-slate-600">No installation, no consumables, no risk. Every experiment is a safe, educational simulation.</p>
        <Link href="/lab" className="btn btn-primary mt-6 px-6 py-2.5 text-[15px]">
          Launch Virtual Lab <ArrowRight size={16} />
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 560 340" className="w-full bg-white">
      <defs>
        <pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#eef2f7" />
        </pattern>
      </defs>
      <rect width="560" height="340" fill="url(#g)" />
      <rect y="270" width="560" height="20" fill="#dfe5ec" />
      <rect y="290" width="560" height="50" fill="#cbd5e1" />
      <rect x="140" y="30" width="7" height="240" rx="3" fill="#94a3b8" />
      <rect x="110" y="262" width="100" height="10" rx="3" fill="#475569" />
      <rect x="147" y="95" width="70" height="6" fill="#94a3b8" />
      <rect x="226" y="30" width="14" height="170" rx="3" fill="#e0f2fe" stroke="#7c8ea3" />
      <rect x="228" y="70" width="10" height="130" fill="#bfdbfe" />
      <rect x="220" y="200" width="26" height="6" rx="2" fill="#16a34a" />
      <circle cx="233" cy="222" r="2.5" fill="#bfdbfe" />
      <path d="M218 150 v30 L185 255 q-3 10 8 10 h80 q11 0 8-10 L248 180 v-30" fill="#f8fafc" stroke="#7c8ea3" strokeWidth="1.6" />
      <path d="M194 232 h78 l9 23 q3 10 -8 10 h-80 q-11 0 -8 -10z" fill="#f472b6" opacity=".75" />
      <rect x="185" y="266" width="100" height="6" rx="2" fill="#94a3b8" />
      <rect x="330" y="150" width="150" height="100" rx="10" fill="#f8fafc" stroke="#cbd5e1" />
      <polyline points="345,230 380,226 410,220 425,212 432,180 438,168 470,163" fill="none" stroke="#2a78d6" strokeWidth="2.5" />
      <text x="345" y="170" fontSize="11" fill="#475569" fontFamily="Inter, sans-serif">pH vs volume</text>
      <rect x="360" y="60" width="90" height="46" rx="6" fill="#0f172a" />
      <text x="405" y="90" textAnchor="middle" fontSize="18" fill="#5eead4" fontFamily="monospace">7.02</text>
    </svg>
  );
}
