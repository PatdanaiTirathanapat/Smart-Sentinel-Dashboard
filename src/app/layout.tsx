import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Sentinel Dashboard",
  description: "NETPIE + Next.js Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
