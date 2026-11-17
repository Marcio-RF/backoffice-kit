import { expect, test } from "@playwright/test"

import { undersizedTargets } from "./support/touch-targets"

test.describe("Orders Detail at 375px", () => {
  test("tapping a card opens the Detail over the whole viewport", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("list", { name: "Orders" }).getByRole("button").first().click()
    const detail = page.getByRole("dialog")
    await expect(detail).toBeVisible()
    await expect(detail).toHaveCSS("opacity", "1")
    const box = await detail.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, top: r.top, width: r.width, height: r.height, vw: innerWidth, vh: innerHeight }
    })
    expect(box.left).toBeCloseTo(0, 0)
    expect(box.top).toBeCloseTo(0, 0)
    expect(box.width).toBeCloseTo(box.vw, 0)
    expect(box.height).toBeCloseTo(box.vh, 0)
  })

  test("the footer offers the same actions as the row menu on desktop", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("list", { name: "Orders" }).getByRole("button").first().click()
    const detail = page.getByRole("dialog")
    await expect(detail.getByRole("button", { name: "Copy order ID" })).toBeVisible()
    await expect(detail.getByRole("button", { name: "Cancel order" })).toBeVisible()
  })

  test("check:mobile: touch targets are 44px and nothing scrolls sideways with the Detail open", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("list", { name: "Orders" }).getByRole("button").first().click()
    await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1")
    expect(await undersizedTargets(page)).toEqual([])
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })

  test("the header close button closes the Detail", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("list", { name: "Orders" }).getByRole("button").first().click()
    const detail = page.getByRole("dialog")
    await detail.getByRole("button", { name: "Close" }).click()
    await expect(detail).toBeHidden()
  })
})

test.describe("Orders Detail at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test("clicking a row opens a side panel no wider than md", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("row").nth(1).click()
    const detail = page.getByRole("dialog")
    await expect(detail).toBeVisible()
    await expect(detail).toHaveCSS("opacity", "1")
    const { width, right, vw } = await detail.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { width: r.width, right: r.right, vw: innerWidth }
    })
    expect(width).toBeLessThan(vw)
    expect(width).toBeLessThanOrEqual(448 + 1)
    expect(right).toBeCloseTo(vw, 0)
  })
})
