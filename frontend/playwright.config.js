import { defineConfig, devices } from "@playwright/test";
import process from "node:process";
export default defineConfig({
  testDir: "./tests", timeout: 60000, expect: { timeout: 10000 }, fullyParallel: false, workers: 1,
  reporter: "list", outputDir: "./test-results",
  use: { baseURL: process.env.E2E_BASE_URL || "http://localhost:5173", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }],
});
