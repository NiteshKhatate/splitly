import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";

import { ToastViewport } from "@/components/ui/toast";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Splitly",
  description: "Share expenses and settle balances with groups.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-control bg-primary px-4 py-3 text-label text-white shadow-lg transition-transform focus:translate-y-0"
          href="#main-content"
        >
          Skip to main content
        </a>
        <div className="contents" id="main-content">
          {children}
        </div>
        <ToastViewport />
      </body>
    </html>
  );
}
