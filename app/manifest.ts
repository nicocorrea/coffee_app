import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Crema — Meraki Gen 2 bean advisor",
    short_name: "Crema",
    description: "Search any coffee and get Meraki Gen 2 settings, flavour notes and drink recipes.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f5",
    theme_color: "#fbf8f5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
