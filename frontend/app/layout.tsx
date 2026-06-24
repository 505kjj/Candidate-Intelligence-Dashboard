import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Candidate Intelligence Dashboard",
  description: "Explainable candidate ranking for intelligent candidate discovery."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="pointer-events-none fixed inset-0 soft-grid opacity-60" />
        <Nav />
        <main className="relative z-10">{children}</main>
        <footer className="relative z-10 border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">
          Candidate Intelligence Dashboard
        </footer>
      </body>
    </html>
  );
}
