import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Japan 2026 Family Planner",
    short_name: "Japan 2026",
    description: "The Ephraums family plan for Osaka, Kyoto and Tokyo.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f7f1e7",
    theme_color: "#c83b2f",
    categories: ["travel", "navigation", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Itinerary", short_name: "Plan", url: "/itinerary", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Trip maps", short_name: "Maps", url: "/maps", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Japan guide", short_name: "Guide", url: "/guide", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
