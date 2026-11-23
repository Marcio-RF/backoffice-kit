import { expect, test } from "@playwright/test"

test("viewport meta declares viewport-fit=cover", async ({ page }) => {
  await page.goto("/orders/new")
  const content = await page.locator('meta[name="viewport"]').getAttribute("content")
  expect(content).toContain("viewport-fit=cover")
})

test("New order: action bar stays flush with the viewport bottom after scrolling to the end", async ({ page }) => {
  await page.goto("/orders/new")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  const bar = page.locator("[data-slot='routed-dialog-footer']")
  await expect(bar).toBeVisible()
  const { bottom, innerHeight } = await bar.evaluate((el) => ({
    bottom: el.getBoundingClientRect().bottom,
    innerHeight: window.innerHeight,
  }))
  expect(Math.abs(bottom - innerHeight)).toBeLessThanOrEqual(1)
})
