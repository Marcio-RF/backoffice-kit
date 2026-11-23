import { expect, test, type Page } from "@playwright/test"

const OUT = "docs/screenshots"
const schemes = ["light", "dark"] as const

// Waits for chart/sheet animations and web fonts so the captures are stable.
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1000)
}

async function shot(page: Page, name: string, scheme: string) {
  await settle(page)
  await page.screenshot({ path: `${OUT}/${name}-${scheme}.png` })
}

for (const scheme of schemes) {
  test.describe(`screenshots (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test.describe("Celular 375x812", () => {
      test.use({ viewport: { width: 375, height: 812 } })

      test(`mobile-overview-${scheme}`, async ({ page }) => {
        await page.goto("/")
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
        await shot(page, "mobile-overview", scheme)
      })

      test(`mobile-orders-${scheme}`, async ({ page }) => {
        await page.goto("/orders")
        await expect(page.getByRole("list", { name: "Orders" })).toBeVisible()
        await shot(page, "mobile-orders", scheme)
      })

      test(`mobile-filters-${scheme}`, async ({ page }) => {
        await page.goto("/orders")
        await page.getByRole("button", { name: "Filters" }).click()
        const panel = page.getByRole("dialog", { name: "Filters" })
        await expect(panel).toHaveCSS("opacity", "1")
        await panel.getByRole("checkbox", { name: /Completed/ }).check()
        await shot(page, "mobile-filters", scheme)
      })

      test(`mobile-detail-${scheme}`, async ({ page }) => {
        await page.goto("/orders")
        await page.getByRole("list", { name: "Orders" }).getByRole("link").first().click()
        await expect(page.getByRole("dialog")).toBeVisible()
        await shot(page, "mobile-detail", scheme)
      })

      test(`mobile-new-order-${scheme}`, async ({ page }) => {
        await page.goto("/orders/new")
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
        await shot(page, "mobile-new-order", scheme)
      })

      test(`mobile-edit-order-${scheme}`, async ({ page }) => {
        await page.goto("/orders")
        await page.getByRole("list", { name: "Orders" }).getByRole("link").first().click()
        await page.getByRole("dialog").getByRole("link", { name: "Edit" }).click()
        await expect(page.getByLabel("Full name")).toBeFocused()
        await shot(page, "mobile-edit-order", scheme)
      })

      test(`mobile-quick-order-${scheme}`, async ({ page }) => {
        await page.goto("/quick-order")
        await expect(page.getByRole("heading", { level: 1, name: "Choose customer" })).toBeVisible()
        await shot(page, "mobile-quick-order", scheme)
      })
    })

    test.describe("Desktop 1440x900", () => {
      test.use({ viewport: { width: 1440, height: 900 } })

      test(`overview-${scheme}`, async ({ page }) => {
        await page.goto("/")
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
        await shot(page, "overview", scheme)
      })

      test(`orders-${scheme}`, async ({ page }) => {
        await page.goto("/orders")
        await expect(page.getByRole("table", { name: "Orders" })).toBeVisible()
        await shot(page, "orders", scheme)
      })

      // The README shows the form and the edit dialog in light, and the Detail in dark only.
      test(`new-order-${scheme}`, async ({ page }) => {
        test.skip(scheme === "dark", "not published")
        await page.goto("/orders/new")
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
        await shot(page, "new-order", scheme)
      })

      test(`orders-dialog-${scheme}`, async ({ page }) => {
        test.skip(scheme === "dark", "not published")
        await page.goto("/orders")
        await page.getByRole("table", { name: "Orders" }).getByRole("row").nth(1).click()
        await expect(page.getByRole("dialog")).toBeVisible()
        await page.getByRole("dialog").getByRole("link", { name: "Edit" }).click()
        await expect(page.getByLabel("Full name")).toBeFocused()
        await shot(page, "orders-dialog", scheme)
      })

      test(`order-sheet-${scheme}`, async ({ page }) => {
        test.skip(scheme === "light", "not published")
        await page.goto("/orders")
        await page.getByRole("table", { name: "Orders" }).getByRole("row").nth(1).click()
        await expect(page.getByRole("dialog")).toBeVisible()
        await shot(page, "order-sheet", scheme)
      })
    })
  })
}
