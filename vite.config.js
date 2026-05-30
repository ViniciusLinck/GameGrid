import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  const basePath =
    process.env.VITE_BASE_PATH ??
    (process.env.GITHUB_ACTIONS ? "/GameGrid/" : "/");

  return {
    plugins: [react()],
    base: basePath,
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8787",
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
    },
  };
});
