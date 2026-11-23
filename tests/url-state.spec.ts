import { expect, test, type Page } from "@playwright/test"

const totalOf = async (page: Page) => {
  const text = await page.getByRole("status").innerText()
  const match = text.match(/of ([\d,]+) orders/)
  return match ? Number(match[1].replace(/,/g, "")) : NaN
}

test.describe("Orders keeps its query in the URL", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test("a status filter goes to the URL and survives a reload, starting from the top", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("button", { name: /^Status/ }).click()
    await page.getByRole("option", { name: /Completed/ }).click()
    await page.keyboard.press("Escape")
    await expect(page).toHaveURL(/[?&]status=completed/)
    await expect.poll(() => totalOf(page)).toBeLessThan(2000)
    const filtered = await totalOf(page)

    await page.mouse.wheel(0, 2000)
    await page.reload()
    await expect(page.getByRole("button", { name: /^Status/ })).toContainText("Completed")
    await expect.poll(() => totalOf(page)).toBe(filtered)
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50)
  })

  test("search and sort go to the URL", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("searchbox", { name: "Search orders" }).fill("Silva")
    await expect(page).toHaveURL(/[?&]q=Silva/)
    await page.getByRole("button", { name: /^Amount/ }).click()
    await expect(page).toHaveURL(/[?&]sort=amount\.(asc|desc)/)
    const dir = new URL(page.url()).searchParams.get("sort")!.endsWith("desc") ? "descending" : "ascending"
    await page.reload()
    await expect(page.getByRole("searchbox", { name: "Search orders" })).toHaveValue("Silva")
    await expect(page.getByRole("columnheader", { name: /Amount/ })).toHaveAttribute("aria-sort", dir)
  })

  test("opening a record from a filtered list keeps the list filtered", async ({ page }) => {
    await page.goto("/orders?status=completed")
    await expect.poll(() => totalOf(page)).toBeLessThan(2000)
    const filtered = await totalOf(page)
    await page.getByRole("table", { name: "Orders" }).getByRole("row").nth(2).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toBeHidden()
    await expect(page).toHaveURL(/[?&]status=completed/)
    expect(await totalOf(page)).toBe(filtered)
  })

  test("typing in the search adds no history entries", async ({ page }) => {
    await page.goto("/customers")
    await page.goto("/orders")
    const search = page.getByRole("searchbox", { name: "Search orders" })
    await search.pressSequentially("Ana", { delay: 400 })
    await expect(page).toHaveURL(/[?&]q=Ana/)
    await page.goBack()
    await expect(page).toHaveURL(/\/customers$/)
  })
})
