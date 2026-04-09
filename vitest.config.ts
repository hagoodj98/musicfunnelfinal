import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["app/__tests__/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "app/__tests__/e2e/**"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
