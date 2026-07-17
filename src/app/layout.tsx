import type { Metadata } from "next";
import { Inter, Abel } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const abel = Abel({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-abel",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "pluto. — Project & Lead Management",
    template: "%s | pluto.",
  },
  description:
    "Kanban-based project and lead management system with CRM, analytics, and collaboration features.",
  keywords: ["kanban", "project management", "lead management", "CRM", "pluto"],
  authors: [{ name: "pluto. Team" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  robots: "noindex",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${abel.variable}`} suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
