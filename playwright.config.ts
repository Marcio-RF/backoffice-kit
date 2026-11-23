import { defineConfig } from "@playwright/test"

const port = 3100

export default defineConfig({
  testDir: "./tests",
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 375, height: 812 },
  },
  projects: [
    // Everything that only reads the example's 2,000 orders (and the screenshots).
    { name: "read", testIgnore: /mutations\.spec\.ts/ },
    // Creates and deletes orders on the shared fake server, so it runs after the rest.
    { name: "mutations", testMatch: /mutations\.spec\.ts/, dependencies: ["read"] },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 300_000,
  },
})
