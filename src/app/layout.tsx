import type { ReactNode } from "react";
import "./globals.css";

// The real <html>/<body> live in app/[locale]/layout.tsx so the lang attribute
// and message provider can be locale-aware (next-intl App Router pattern).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
