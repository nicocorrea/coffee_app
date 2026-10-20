import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { ...devices["iPhone 13"], baseURL: "http://localhost:3124", browserName: "chromium" },
  webServer: {
    command: "npm run build && npx next start -p 3124",
    url: "http://localhost:3124",
    env: { DEMO_MODE: "1" },
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
