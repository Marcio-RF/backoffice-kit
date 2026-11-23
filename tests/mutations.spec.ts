import { expect, test, type Page } from "@playwright/test"

// These tests change the example's orders, so they run after every other spec (see playwright.config.ts).

const totalOf = async (page: Page) => {
  const match = (await page.getByRole("status").innerText()).match(/([\d,]+) of ([\d,]+) orders/)
  return match ? { loaded: Number(match[1].replace(/,/g, "")), total: Number(match[2].replace(/,/g, "")) } : null
}

const card = (page: Page, href: string) => page.locator(`li:has(a[href="${href}"]), li[data-mark]:has-text("${href.split("/").pop()}")`)

test.describe("Only the changed record is updated, at 375px", () => {
  test("New order: created from the list, it shows on top marked New and the total goes up", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("status")).toHaveText(/^50 of [\d,]+ orders$/)
    const before = (await totalOf(page))!
    await page.getByRole("link", { name: "New order" }).click()
    const dialog = page.getByRole("dialog")
    await expect(page.getByLabel("Full name")).toBeFocused()
    await page.getByLabel("Full name").fill("Test Customer")
    await page.getByRole("textbox", { name: "Email" }).fill("test.customer@example.com")
    await page.getByLabel("Amount (€)").fill("99")
    await page.getByRole("combobox", { name: "Channel" }).click()
    await page.getByRole("option", { name: "Phone" }).click()
    await dialog.getByRole("button", { name: "Create order" }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/orders$/)
    const first = page.getByRole("list", { name: "Orders" }).getByRole("listitem").first()
    await expect(first).toContainText("Test Customer")
    await expect(first).toContainText("New")
    await expect.poll(async () => (await totalOf(page))?.total).toBe(before.total + 1)
    expect((await totalOf(page))!.loaded).toBe(before.loaded + 1)
  })

  test("an order edited out of the filter stays where it was, marked, and the scroll doesn't move", async ({ page }) => {
    await page.goto("/orders?status=pending")
    await expect(page.getByRole("status")).toHaveText(/^50 of [\d,]+ orders$/)
    await page.mouse.wheel(0, 400)
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(300)
    const scrolled = await page.evaluate(() => Math.round(window.scrollY))
    const link = page.getByRole("list", { name: "Orders" }).getByRole("link").nth(7)
    const href = (await link.getAttribute("href"))!
    await link.click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("link", { name: "Edit" }).click()
    await page.getByRole("combobox", { name: "Status" }).click()
    await page.getByRole("option", { name: "Completed" }).click()
    await dialog.getByRole("button", { name: "Save changes" }).click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
    await dialog.getByRole("button", { name: "Close" }).click()
    await expect(dialog).toBeHidden()

    const row = card(page, href)
    await expect(row).toHaveAttribute("data-mark", "stale")
    await expect(row).toContainText("Doesn't match filters")
    await expect(row).toContainText("Completed")
    expect(Math.abs((await page.evaluate(() => Math.round(window.scrollY))) - scrolled)).toBeLessThan(2)

    // A new search starts over, without marks.
    await page.getByRole("searchbox", { name: "Search orders" }).fill("a")
    await expect(page.locator("li[data-mark]")).toHaveCount(0)
  })

  test("a deleted order stays in place, marked Deleted, and no longer opens", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("status")).toHaveText(/^50 of [\d,]+ orders$/)
    const link = page.getByRole("list", { name: "Orders" }).getByRole("link").nth(3)
    const href = (await link.getAttribute("href"))!
    await link.click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("button", { name: "Delete" }).click()
    await expect(dialog).toBeHidden()
    const row = card(page, href)
    await expect(row).toHaveAttribute("data-mark", "deleted")
    await expect(row).toContainText("Deleted")
    await expect(row.getByRole("link")).toHaveCount(0)
  })

  test("saving goes back to the Detail, which shows the change", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("status")).toHaveText(/^50 of [\d,]+ orders$/)
    await page.getByRole("list", { name: "Orders" }).getByRole("link").nth(1).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("link", { name: "Edit" }).click()
    await expect(page.getByLabel("Full name")).toBeFocused()
    await page.getByLabel("Amount (€)").fill("1234.5")
    await dialog.getByRole("button", { name: "Save changes" }).click()
    await expect(page).toHaveURL(/\/orders\/ORD-\d+$/)
    await expect(dialog).toContainText("€1,234.50")
    await expect(page.getByRole("dialog", { name: "Discard changes?" })).toBeHidden()
  })
})
