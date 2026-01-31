import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

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
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap" rel="stylesheet" />
      </head>
      <body className={`${lexend.variable} antialiased min-h-screen flex flex-col`}>
        <Header />
        <div className="flex-1 max-w-5xl mx-auto w-full bg-base-100 border border-base-300 shadow-sm flex flex-col mt-6 mb-4 rounded-2xl overflow-hidden">
          <main className="flex-1 flex flex-col px-6">
            {children}
          </main>
          <footer className="footer footer-center py-8 bg-transparent text-base-content text-xs opacity-50">
            <p>Axon Flashcards © 2026 — Optimized by FSRS</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
