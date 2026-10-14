import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.playwright.spec.ts",
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } }
  ]
});
