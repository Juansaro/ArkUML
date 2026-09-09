import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{arg}{-projectName}{-snapshotSuffix}{ext}",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      grep: /@smoke|@export-spike/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      grep: /@smoke|@export-spike/,
    },
  ],
  webServer: {
    command: process.env.CI
      ? "npm run preview -- --host 127.0.0.1 --port 5173 --strictPort"
      : "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
