import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Project Pages are served from /<repo>/, so CI sets VITE_BASE=/forge-ai-engineer/.
  base: process.env.VITE_BASE ?? "/",
  plugins: [
    react(),
    tailwindcss(),
  ],
});
