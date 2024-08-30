import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import fs from "fs";

export default defineConfig({
  plugins: [solid()],
  server: {
    https: {
      key: fs.readFileSync("smpcnt.local-key.pem"),
      cert: fs.readFileSync("smpcnt.local.pem"),
    },
    host: "smpcnt.local",
  },
});
