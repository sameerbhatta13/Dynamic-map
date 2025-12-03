import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://192.168.1.147:5000",
    },
  },
  plugins: [react(), tailwindcss()],
});
