import { expect, test } from "@playwright/test"

import { undersizedTargets } from "./support/touch-targets"

const pages = [
  { name: "Overview", path: "/" },
  { name: "Orders", path: "/orders" },
  { name: "New order", path: "/orders/new" },
  { name: "Customers", path: "/customers" },
  { name: "Settings", path: "/settings" },
  { name: "Fixtures", path: "/fixtures" },
]

for (const { name, path } of pages) {
  test(`${name}: touch targets are at least 44px at 375px`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    expect(await undersizedTargets(page)).toEqual([])
  })

  test(`${name}: form fields compute to 16px or more at 375px`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("input:not([type='hidden']), textarea, select")]
        .filter((el) => {
          const rect = el.getBoundingClientRect()
          // Radix renders a hidden native <select> next to each Select.
          return rect.width > 0 && rect.height > 0 && !el.closest("[aria-hidden='true']")
        })
        .map((el) => ({
          slot: el.getAttribute("data-slot"),
          tag: el.tagName,
          type: el.getAttribute("type"),
          cls: el.className.toString().slice(0, 60),
          size: parseFloat(getComputedStyle(el).fontSize),
        }))
        .filter(({ size }) => size < 16)
    )
    expect(small).toEqual([])
  })
}

// Select triggers are buttons, not inputs, so the 16px rule must reach them too.
test("Select trigger text computes to 16px or more at 375px", async ({ page }) => {
  await page.goto("/orders/new")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll("[data-slot='select-trigger']")].map((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    )
  )
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16)
})

test.describe("desktop density is unchanged at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test("default button stays 32px tall", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll("[data-slot='button']")]
        .filter((el) => el.getBoundingClientRect().height > 0)
        .map((el) => Math.round(el.getBoundingClientRect().height))
    )
    expect(heights).toContain(32)
    expect(Math.max(...heights)).toBeLessThan(44)
  })
})
