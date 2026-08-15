import { defineConfig } from "@playwright/test";

const testPort = Number(process.env.SIXTHSTREET_TEST_PORT || 4173);

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: `http://127.0.0.1:${testPort}`,
    trace: "retain-on-failure"
  },
  webServer: {
    command: `PORT=${testPort} npm run serve`,
    port: testPort,
    reuseExistingServer: false
  }
});
