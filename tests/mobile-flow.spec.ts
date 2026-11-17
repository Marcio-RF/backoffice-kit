import { expect, test } from "@playwright/test"

import { undersizedTargets } from "./support/touch-targets"

test("Quick order: action bar stays flush with the viewport bottom after scrolling", async ({ page }) => {
  await page.goto("/quick-order")
  await expect(page.getByRole("heading", { level: 1, name: "Choose customer" })).toBeVisible()
  const content = page.locator("[data-slot='mobile-flow-content']")
  await content.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  expect(await content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  const bar = page.locator("[data-slot='mobile-flow-actions']")
  await expect(bar).toBeVisible()
  const { bottom, innerHeight } = await bar.evaluate((el) => ({
    bottom: el.getBoundingClientRect().bottom,
    innerHeight: window.innerHeight,
  }))
  expect(Math.abs(bottom - innerHeight)).toBeLessThanOrEqual(1)
})

test("Quick order: works from the first step to the confirmation", async ({ page }) => {
  await page.goto("/quick-order")
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled()
  await page.getByRole("radio").first().check()
  await page.getByRole("button", { name: "Continue" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Confirm amount" })).toBeVisible()
  await page.getByRole("button", { name: "Confirm order" }).click()
  await expect(page.getByText("Enter an amount greater than 0.")).toBeVisible()
  await page.getByLabel("Amount (€)").fill("129.90")
  await page.getByRole("button", { name: "Confirm order" }).click()
  await expect(page).toHaveURL(/\/orders$/)
})

test("Quick order: the back button goes from step 2 to step 1", async ({ page }) => {
  await page.goto("/quick-order")
  await page.getByRole("radio").first().check()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.getByRole("button", { name: "Back" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Choose customer" })).toBeVisible()
})

for (const step of [1, 2]) {
  test(`check:mobile: Quick order step ${step} has no horizontal scroll, 44px targets and 16px fields`, async ({ page }) => {
    await page.goto("/quick-order")
    if (step === 2) {
      await page.getByRole("radio").first().check()
      await page.getByRole("button", { name: "Continue" }).click()
      await expect(page.getByRole("heading", { level: 1, name: "Confirm amount" })).toBeVisible()
    }
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    expect(await undersizedTargets(page)).toEqual([])
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("input:not([type='hidden'])")]
        .filter((el) => el.getBoundingClientRect().width > 0 && !el.closest("[aria-hidden='true']"))
        .map((el) => parseFloat(getComputedStyle(el).fontSize))
        .filter((size) => size < 16),
    )
    expect(small).toEqual([])
  })
}
