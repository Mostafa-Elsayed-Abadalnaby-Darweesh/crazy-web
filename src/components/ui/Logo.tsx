import Link from "next/link";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#2563EB" />
      <path d="M12 6h8M13.5 6v7.5L8 23.5A2.5 2.5 0 0 0 10.2 27h11.6a2.5 2.5 0 0 0 2.2-3.5L18.5 13.5V6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 20h11" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
      <LogoMark />
      {!compact && (
        <span className="text-[15px] tracking-tight">
          Virtual<span className="text-primary">Lab</span>
        </span>
      )}
    </Link>
  );
}
