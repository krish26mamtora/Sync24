import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sync24",
  description: "Your daily technology news edition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
