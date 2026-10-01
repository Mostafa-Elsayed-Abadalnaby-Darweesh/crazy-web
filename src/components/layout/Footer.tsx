import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";

export function MadeBy({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      Made by <span className="font-semibold text-slate-700">Mostafa Elsayed</span>
    </span>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 font-semibold">
            <LogoMark size={24} /> Virtual Lab
          </div>
          <p className="mt-2 text-sm text-slate-500">
            An educational, virtual laboratory for chemistry and physics. All experiments are simulations — never attempt hazardous procedures outside a supervised laboratory.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div className="space-y-2">
            <div className="section-title">Product</div>
            <Link className="block text-slate-600 hover:text-primary" href="/lab">Workspace</Link>
            <Link className="block text-slate-600 hover:text-primary" href="/templates">Templates</Link>
            <Link className="block text-slate-600 hover:text-primary" href="/data">Data & charts</Link>
          </div>
          <div className="space-y-2">
            <div className="section-title">Library</div>
            <Link className="block text-slate-600 hover:text-primary" href="/experiments">My experiments</Link>
            <Link className="block text-slate-600 hover:text-primary" href="/reports">Reports</Link>
            <Link className="block text-slate-600 hover:text-primary" href="/saved">Saved labs</Link>
          </div>
          <div className="space-y-2">
            <div className="section-title">Support</div>
            <Link className="block text-slate-600 hover:text-primary" href="/help">Help centre</Link>
            <Link className="block text-slate-600 hover:text-primary" href="/settings">Settings</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Virtual Lab · Educational simulation software</span>
          <MadeBy />
        </div>
      </div>
    </footer>
  );
}
