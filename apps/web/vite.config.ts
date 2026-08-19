import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    // `true` binds every available interface; the literal "::" the Lovable
    // template used fails on hosts without IPv6.
    host: true,
    port: 8080,
    proxy: {
      // In development the API runs separately; in production Caddy serves both
      // under one origin, so the front-end always calls a same-origin /api.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
  },
});
