import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      // Mirrors the "@" alias from tsconfig so tests can use the same imports as the app.
      "@": path.resolve(__dirname, "."),
    },
  },
});