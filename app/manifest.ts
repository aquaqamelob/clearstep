import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClearStep — From panic to plan",
    short_name: "ClearStep",
    description:
      "ClearStep zamienia panikę zdrowotną w deterministyczny plan działania. Wsparcie dla młodych dorosłych w sytuacjach takich jak nieplanowana ciąża czy kryzys psychiczny.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0ea5e9",
    lang: "pl",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
