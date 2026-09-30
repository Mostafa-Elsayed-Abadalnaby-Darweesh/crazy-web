"use client";
import { AppHeader } from "./AppHeader";
import { SiteFooter } from "./Footer";
import { Toasts } from "@/components/ui/Toasts";

export function PageShell({ title, subtitle, actions, children }: { title?: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {title && (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
      <SiteFooter />
      <Toasts />
    </div>
  );
}
