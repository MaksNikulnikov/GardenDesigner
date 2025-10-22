import { defineConfig } from "vite";

export default defineConfig({
  base: "/GardenDesigner/",
  build: {
    target: "esnext",
    minify: "esbuild", 
    outDir: "dist",     
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    open: true,
  },
});
