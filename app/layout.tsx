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
    <html lang="en" data-theme="wireframe">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <div className="flex flex-1 flex-col px-4">

          <Header />
          <div className="flex-1 max-w-5xl px-4 mx-auto w-full bg-base-100 border border-base-300 shadow-sm flex flex-col mt-6 mb-4 rounded-2xl overflow-hidden">
            <main className="flex-1 flex flex-col px-6">
              {children}
            </main>
            <footer className="footer footer-center py-8 bg-transparent text-base-content text-xs opacity-50">
              <p>Axon Flashcards © 2026 — Optimized by FSRS</p>
            </footer>
          </div>
        </div>

      </body>
    </html>
  );
}
