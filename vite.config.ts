import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  define: {
    __DEV__: process.env.NODE_ENV !== "production",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Infinity,
    rollupOptions: {
      input: "index.html",
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
