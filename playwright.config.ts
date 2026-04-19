import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "https://www.ktimahub.gr";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Auth setup runs first
    {
      name: "owner-setup",
      testMatch: /owner\.setup\.ts/,
    },
    {
      name: "leaseholder-setup",
      testMatch: /leaseholder\.setup\.ts/,
    },

    // Unauthenticated tests — no setup dependency
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /.*\.(owner|leaseholder)\.spec\.ts|mobile\.spec\.ts/,
    },
    // Mobile runs only the dedicated mobile spec (Pixel 5 = Chromium-based, touch enabled)
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: /.*mobile\.spec\.ts/,
    },

    // Authenticated owner tests
    {
      name: "owner",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".playwright/owner.json",
      },
      testMatch: /.*\.owner\.spec\.ts/,
      dependencies: ["owner-setup"],
    },

    // Authenticated leaseholder tests
    {
      name: "leaseholder",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".playwright/leaseholder.json",
      },
      testMatch: /.*\.leaseholder\.spec\.ts/,
      dependencies: ["leaseholder-setup"],
    },
  ],
});
