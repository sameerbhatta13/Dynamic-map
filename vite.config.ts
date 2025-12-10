import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // "/api": "http://localhost:5173",
      "/api": "https://map-be.cellapp.co",
      // "/api": { target: "https://map-be.cellapp.co", changeOrigin: true },
    },
  },
  plugins: [react(), tailwindcss()],
});
