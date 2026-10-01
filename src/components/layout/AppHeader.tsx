"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, HelpCircle, LogOut, Settings, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { GlobalSearch } from "./GlobalSearch";
import { useLab } from "@/store/labStore";
import { useSettings } from "@/store/settingsStore";

export const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/experiments", label: "My Experiments" },
  { href: "/templates", label: "Templates" },
  { href: "/reports", label: "Reports" },
  { href: "/saved", label: "Saved Labs" },
  { href: "/help", label: "Help" },
];

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open, close]);
  return ref;
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const notifications = useLab((s) => s.notifications);
  const markRead = useLab((s) => s.markNotificationsRead);
  const clear = useLab((s) => s.clearNotifications);
  const unread = notifications.filter((n) => !n.read).length;
  const ref = useOutside(open, () => setOpen(false));
  const dot: Record<string, string> = { info: "bg-primary", success: "bg-emerald-500", caution: "bg-amber-500", danger: "bg-red-500" };
  return (
    <div className="relative" ref={ref}>
      <button
        className="icon-btn relative"
        aria-label="Notifications"
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(markRead, 800);
        }}
      >
        <Bell size={17} />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="panel absolute right-0 top-10 z-[90] w-80 shadow-float">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <button className="text-xs text-slate-500 hover:text-primary" onClick={clear}>
              Clear all
            </button>
          </div>
          <div className="scrollbar-thin max-h-80 overflow-auto">
            {notifications.length === 0 && <div className="px-3 py-8 text-center text-sm text-slate-400">You&apos;re all caught up.</div>}
            {notifications.map((n) => (
              <div key={n.id} className="flex gap-2.5 border-b border-slate-50 px-3 py-2.5 last:border-0">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[n.level]}`} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink">{n.title}</div>
                  <div className="text-xs text-slate-500">{n.message}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{new Date(n.at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const profile = useSettings((s) => s.profile);
  const ref = useOutside(open, () => setOpen(false));
  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button className="flex items-center gap-1.5 rounded-md py-1 pl-1 pr-1.5 hover:bg-slate-100" onClick={() => setOpen(!open)}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-[11px] font-bold text-white">{initials || "VL"}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {open && (
        <div className="panel absolute right-0 top-10 z-[90] w-56 p-1 shadow-float">
          <div className="border-b border-slate-100 px-3 py-2">
            <div className="text-sm font-semibold">{profile.name}</div>
            <div className="text-xs text-slate-500">{profile.institution}</div>
          </div>
          <Link href="/settings" className="flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)}>
            <User size={14} /> Profile
          </Link>
          <Link href="/settings" className="flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)}>
            <Settings size={14} /> Settings
          </Link>
          <Link href="/help" className="flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)}>
            <HelpCircle size={14} /> Help & shortcuts
          </Link>
          <Link href="/" className="flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)}>
            <LogOut size={14} /> Sign out
          </Link>
        </div>
      )}
    </div>
  );
}

export function AppHeader({ actions, searchProps }: { actions?: React.ReactNode; searchProps?: React.ComponentProps<typeof GlobalSearch> }) {
  const path = usePathname();
  return (
    <header className="no-print sticky top-0 z-50 flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
      <Logo />
      <nav className={`hidden items-center gap-0.5 ${actions ? "2xl:flex" : "lg:flex"}`}>
        {NAV.map((n) => {
          const active = path === n.href || (n.href !== "/" && path?.startsWith(n.href));
          return (
            <Link key={n.href} href={n.href} className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium transition ${active ? "bg-primary-50 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-ink"}`}>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-1 items-center justify-end gap-2">
        <GlobalSearch {...searchProps} />
        {actions}
        <Notifications />
        <ProfileMenu />
      </div>
    </header>
  );
}
