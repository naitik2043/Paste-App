import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Paste Vault",
        short_name: "Paste Vault",
        description: "An independent developer workspace for code snippets, programming solutions and technical notes with optional LeetMetric sign-in.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#090d18",
        theme_color: "#090d18",
        icons: [
          { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//]
      }
    })
  ]
});
