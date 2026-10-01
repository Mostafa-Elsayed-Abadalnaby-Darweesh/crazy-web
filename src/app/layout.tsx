import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Virtual Lab — Interactive Chemistry & Physics Laboratory",
  description: "Build, simulate and report chemistry and physics experiments in a drag-and-drop virtual laboratory.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
