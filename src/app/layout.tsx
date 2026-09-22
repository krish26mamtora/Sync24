import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://sync24.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Sync24 | Latest Tech & AI News in the Last 24 Hours",
    template: "%s | Sync24",
  },

  description:
    "Sync24 brings you the top technology, AI, software and IT news from the last 24 hours, selected and organized into one daily edition.",

  keywords: [
    "Sync24",
    "latest tech news",
    "latest technology news",
    "recent tech news",
    "today's tech news",
    "AI news",
    "latest AI news",
    "AI updates",
    "technology updates",
    "software news",
    "IT news",
    "latest IT news",
    "tech news last 24 hours",
    "technology news last 24 hours",
    "daily tech news",
    "daily technology updates",
  ],

  authors: [{ name: "Sync24" }],
  creator: "Sync24",
  publisher: "Sync24",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Sync24",
    title: "Sync24 | Latest Tech & AI News in the Last 24 Hours",
    description:
      "Your daily edition of the top technology, AI, software and IT news from the last 24 hours.",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Sync24 | Latest Tech & AI News",
    description:
      "Top technology, AI, software and IT news from the last 24 hours.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/sync_logo.png",
    apple: "/sync_logo.png",
  },

  manifest: "/manifest.webmanifest",
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
