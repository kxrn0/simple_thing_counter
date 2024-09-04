import { defineConfig } from "vite";
import { VitePWA, VitePWAOptions } from "vite-plugin-pwa";
import solid from "vite-plugin-solid";
import fs from "fs";

const base = "/simple_thing_counter/";
const options: Partial<VitePWAOptions> = {
  mode: "production",
  base,
  workbox: { globPatterns: ["**/*"] },
  includeAssets: ["**/*"],
  manifest: {
    name: "STC",
    short_name: "STC",
    theme_color: "#2463ff",
    background_color: "#25abff",
    icons: [
      {
        src: `${base}icons/pwa-192x192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${base}icons/pwa-512x512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${base}icons/pwa-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  },
};

const isDev = process.env.NODE_ENV === "development";
const server = isDev
  ? {
      https: {
        key: fs.readFileSync("smpcnt.local-key.pem"),
        cert: fs.readFileSync("smpcnt.local.pem"),
      },
      host: "smpcnt.local",
    }
  : {};

export default defineConfig({
  base,
  plugins: [solid(), VitePWA(options)],
  server,
});
