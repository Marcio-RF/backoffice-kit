import { defineConfig } from "@playwright/test"

const port = 3100

export default defineConfig({
  testDir: "./tests",
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 375, height: 812 },
  },
  webServer: {
    command: `pnpm build && pnpm start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 300_000,
  },
})
