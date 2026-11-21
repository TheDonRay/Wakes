/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// "Today" is computed in the local timezone. Pin tests to New York so
// midnight/DST cases are deterministic on any machine.
process.env.TZ = "America/New_York";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    css: false,
  },
});
