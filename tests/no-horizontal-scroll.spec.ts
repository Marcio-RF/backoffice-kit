import { expect, test } from "@playwright/test"

const pages = [
  { name: "Overview", path: "/" },
  { name: "Orders", path: "/orders" },
  { name: "New order", path: "/orders/new" },
  { name: "Customers", path: "/customers" },
  { name: "Settings", path: "/settings" },
]

for (const { name, path } of pages) {
  test(`${name} has no horizontal scroll at 375px`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole("main")).toBeVisible()
    await page.waitForLoadState("networkidle")

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })
}
