import { defineConfig, loadEnv } from "vite";
import process from "node:process";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "/",
    plugins: [react(), tailwindcss()],
    server: { proxy: { "/api": { target: env.VITE_API_URL || "http://localhost:8000", changeOrigin: true } } },
    preview: { proxy: { "/api": { target: env.VITE_API_URL || "http://localhost:8000", changeOrigin: true } } },
  };
});
