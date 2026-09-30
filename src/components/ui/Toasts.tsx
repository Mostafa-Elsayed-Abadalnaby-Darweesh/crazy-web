"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from "lucide-react";
import { useLab, type Notification } from "@/store/labStore";

const STYLE: Record<Notification["level"], { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "border-primary-100 text-primary" },
  success: { icon: CheckCircle2, cls: "border-emerald-200 text-emerald-600" },
  caution: { icon: AlertTriangle, cls: "border-amber-200 text-amber-600" },
  danger: { icon: OctagonAlert, cls: "border-red-200 text-red-600" },
};

/** Transient toast stack mirroring new notifications. */
export function Toasts() {
  const notifications = useLab((s) => s.notifications);
  const [visible, setVisible] = useState<Notification[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fresh = notifications.filter((n) => !seen.has(n.id) && Date.now() - n.at < 4000);
    if (!fresh.length) return;
    setSeen((s) => new Set([...s, ...fresh.map((n) => n.id)]));
    setVisible((v) => [...fresh.slice(0, 3).filter((f) => !v.some((x) => x.id === f.id)), ...v].slice(0, 4));
    const ids = fresh.map((f) => f.id);
    const t = setTimeout(() => setVisible((v) => v.filter((n) => !ids.includes(n.id))), fresh.some((f) => f.level === "danger") ? 7000 : 4000);
    return () => clearTimeout(t);
  }, [notifications, seen]);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[120] flex w-[360px] flex-col gap-2">
      {visible.map((n) => {
        const S = STYLE[n.level];
        return (
          <div key={n.id} className={`pointer-events-auto flex gap-3 rounded-lg border bg-white p-3 shadow-float ${S.cls}`}>
            <S.icon size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink">{n.title}</div>
              <div className="text-xs text-slate-600">{n.message}</div>
            </div>
            <button className="text-slate-400 hover:text-slate-600" onClick={() => setVisible((v) => v.filter((x) => x.id !== n.id))}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
