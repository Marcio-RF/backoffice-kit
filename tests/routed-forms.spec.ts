import { expect, test, type Page } from "@playwright/test"

import { undersizedTargets } from "./support/touch-targets"

async function openEdit(page: Page) {
  await page.goto("/orders")
  await expect(page.getByRole("status")).toHaveText("50 of 2,000 orders")
  await page.getByRole("list", { name: "Orders" }).getByRole("link").nth(1).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("link", { name: "Edit" }).click()
  await expect(page).toHaveURL(/\/orders\/ORD-\d+\/edit$/)
  await expect(dialog.getByRole("heading", { level: 2, name: /^Edit ORD-/ })).toBeVisible()
  return dialog
}

test.describe("Forms in the Dialog roteado at 375px", () => {
  test("Edit opens with the focus on the first field", async ({ page }) => {
    await openEdit(page)
    await expect(page.getByLabel("Full name")).toBeFocused()
  })

  test("closing with unsaved changes asks first; Keep editing stays, Discard leaves", async ({ page }) => {
    const dialog = await openEdit(page)
    await page.getByLabel("Full name").fill("Someone Else")
    await page.keyboard.press("Escape")
    const ask = page.getByRole("dialog", { name: "Discard changes?" })
    await expect(ask).toBeVisible()
    await ask.getByRole("button", { name: "Keep editing" }).click()
    await expect(ask).toBeHidden()
    await expect(page).toHaveURL(/\/edit$/)
    await expect(page.getByLabel("Full name")).toHaveValue("Someone Else")

    // The browser's back asks too, and the form stays where it was.
    await page.goBack()
    await expect(ask).toBeVisible()
    await expect(page).toHaveURL(/\/edit$/)
    await ask.getByRole("button", { name: "Keep editing" }).click()
    await expect(page.getByLabel("Full name")).toHaveValue("Someone Else")

    await dialog.getByRole("button", { name: "Cancel" }).click()
    await ask.getByRole("button", { name: "Discard" }).click()
    await expect(page).toHaveURL(/\/orders\/ORD-\d+$/)
    await expect(dialog.getByRole("button", { name: "Copy order ID" })).toBeVisible()
  })

  test("saving goes back to the Detail, which shows the change", async ({ page }) => {
    const dialog = await openEdit(page)
    await page.getByLabel("Amount (€)").fill("1234.5")
    await dialog.getByRole("button", { name: "Save changes" }).click()
    await expect(page).toHaveURL(/\/orders\/ORD-\d+$/)
    await expect(dialog).toContainText("€1,234.50")
    await expect(page.getByRole("dialog", { name: "Discard changes?" })).toBeHidden()
  })

  test("check:mobile inside the form: 44px targets, 16px fields, no sideways scroll, footer at the bottom", async ({
    page,
  }) => {
    await openEdit(page)
    expect(await undersizedTargets(page)).toEqual([])
    const sizes = await page
      .locator("[data-slot='routed-dialog'] input, [data-slot='routed-dialog'] textarea")
      .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)))
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16)
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    const bottom = await page.locator("[data-slot='routed-dialog-footer']").evaluate((el) => el.getBoundingClientRect().bottom)
    expect(Math.abs(bottom - 812)).toBeLessThanOrEqual(1)
  })

  test("New order opens from the list in the dialog and creating closes it", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("link", { name: "New order" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { level: 2, name: "New order" })).toBeVisible()
    await expect(page.getByLabel("Full name")).toBeFocused()
    await page.getByLabel("Full name").fill("Test Customer")
    await page.getByRole("textbox", { name: "Email" }).fill("test.customer@example.com")
    await page.getByLabel("Amount (€)").fill("99")
    await page.getByRole("combobox", { name: "Channel" }).click()
    await page.getByRole("option", { name: "Phone" }).click()
    await dialog.getByRole("button", { name: "Create order" }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/orders$/)
  })
})
