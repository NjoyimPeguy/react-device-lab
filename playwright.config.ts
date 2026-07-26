import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./test-results",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run test:browser:serve",
      url: "http://127.0.0.1:4173/tests/browser/frame-harness.html",
      reuseExistingServer: !process.env["CI"],
    },
    {
      command: "npm run test:browser:serve:cross",
      url: "http://127.0.0.1:4174/tests/browser/preview-target.html",
      reuseExistingServer: !process.env["CI"],
    },
    {
      command: "npm run demo:serve",
      url: "http://127.0.0.1:4175/",
      reuseExistingServer: !process.env["CI"],
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
