import type { MetadataRoute } from "next"

// PWA-манифест. Next отдаёт его по /manifest.webmanifest и сам добавляет <link rel="manifest">.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Control — дисциплина и контроль",
    short_name: "Control",
    description: "Задачи, фокус, деньги и CRM — личный пульт управления.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "ru",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
