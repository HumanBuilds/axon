import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "AXON — Flashcards",
  description: "Advanced FSRS-powered learning platform",
};

import { Header } from "@/components/layout/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="axonLight">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <footer className="w-full border-t border-base-300 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-center text-xs opacity-50 m-0">Axon Flashcards © 2026 — Optimized by FSRS</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
