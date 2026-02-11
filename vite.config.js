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
        manualChunks(id) {
          if (id.includes("src/World/tutorial/")) return "tutorial";
          if (id.includes("three/examples")) return "three-examples";
          if (id.includes("node_modules/three")) return "three-core";
          if (id.includes("node_modules/gsap")) return "animation-vendor";
          if (id.includes("node_modules")) return "vendor";
          return undefined;
        },
      },
    },
  },
  server: {
    open: true,
  },
});
