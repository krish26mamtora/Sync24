import type { MetadataRoute } from "next";

/*
 * Next.js serves this at /manifest.webmanifest and automatically adds
 * <link rel="manifest"> to every page. No extra wiring needed.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sync24",
    short_name: "Sync24",
    description: "Your daily technology news, in one sync.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    categories: ["news", "technology"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
