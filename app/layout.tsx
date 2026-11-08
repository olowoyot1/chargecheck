import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OAATZ ChargeCheck",
  description: "Review bank transactions, spot questionable charges and organise evidence for a complaint."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}