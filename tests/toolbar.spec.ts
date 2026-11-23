import { expect, test, type Page } from "@playwright/test"

const total = async (page: Page) => {
  const text = await page.getByRole("status").innerText()
  const match = text.match(/of ([\d,]+)/)
  return match ? Number(match[1].replace(/,/g, "")) : NaN
}

const amounts = async (page: Page) =>
  (await page.getByRole("list", { name: "Orders" }).locator("[data-slot='card-value']").allInnerTexts()).map((v) =>
    Number(v.replace(/[^\d.]/g, "")),
  )

const isSorted = (values: number[], dir: "asc" | "desc") =>
  values.length > 5 &&
  values.every((v, i) => i === 0 || (dir === "asc" ? values[i - 1] <= v : values[i - 1] >= v))

test.describe("Orders toolbar at 375px", () => {
  test("search is always visible; density and columns are hidden", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("searchbox", { name: "Search orders" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Filters" })).toBeVisible()
    await expect(page.getByLabel("Row density")).toBeHidden()
    await expect(page.getByRole("button", { name: "Columns" })).toBeHidden()
    await expect(page.getByRole("button", { name: "Status" })).toBeHidden()
  })

  test("the panel applies a status filter at once; the button counts it and View N results matches the list", async ({
    page,
  }) => {
    await page.goto("/orders")
    await page.getByRole("button", { name: "Filters" }).click()
    const panel = page.getByRole("dialog", { name: "Filters" })
    await panel.getByRole("checkbox", { name: /Completed/ }).check()
    const view = panel.getByRole("button", { name: /^View [\d,]+ results$/ })
    const shown = async () => Number((await view.innerText()).replace(/[^\d]/g, ""))
    await expect.poll(shown).toBeLessThan(2000)
    const n = await shown()
    expect(n).toBeGreaterThan(0)
    await view.click()
    await expect(panel).toBeHidden()
    await expect.poll(() => total(page)).toBe(n)
    await expect(page.getByRole("button", { name: "Filters (1)" })).toBeVisible()
  })

  test("Clear in the panel removes the filters and the sort", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("button", { name: "Filters" }).click()
    const panel = page.getByRole("dialog", { name: "Filters" })
    await panel.getByRole("checkbox", { name: /Cancelled/ }).check()
    await panel.getByRole("button", { name: "Clear" }).click()
    await expect(panel.getByRole("button", { name: "View 2,000 results" })).toBeVisible()
    await expect(panel.getByRole("checkbox", { name: /Cancelled/ })).not.toBeChecked()
  })

  test("Sort by in the panel reorders the cards", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("button", { name: "Filters" }).click()
    const panel = page.getByRole("dialog", { name: "Filters" })
    await panel.getByRole("radio", { name: "Amount" }).check()
    await panel.getByRole("radio", { name: "Descending" }).check()
    await panel.getByRole("button", { name: /^View/ }).click()
    await expect(panel).toBeHidden()
    await expect.poll(async () => isSorted(await amounts(page), "desc")).toBe(true)
    await page.getByRole("button", { name: "Filters" }).click()
    await panel.getByRole("radio", { name: "Ascending" }).check()
    await panel.getByRole("button", { name: /^View/ }).click()
    await expect(panel).toBeHidden()
    await expect.poll(async () => isSorted(await amounts(page), "asc")).toBe(true)
  })
})

test.describe("Orders toolbar at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test("shows the chips, density and columns, and no Filters button", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("button", { name: "Status" })).toBeVisible()
    await expect(page.getByLabel("Row density")).toBeVisible()
    await expect(page.getByRole("button", { name: "Columns" })).toBeVisible()
    await expect(page.getByRole("button", { name: /^Filters/ })).toBeHidden()
  })

  test("the chip and the panel give the same total for the same status", async ({ page, browser }) => {
    await page.goto("/orders")
    await page.getByRole("button", { name: /^Status/ }).click()
    await page.getByRole("option", { name: /Completed/ }).click()
    await page.keyboard.press("Escape")
    await expect.poll(() => total(page)).toBeLessThan(2000)
    const desktop = await total(page)

    const phone = await browser.newPage({ viewport: { width: 375, height: 812 } })
    await phone.goto(page.url())
    await phone.getByRole("button", { name: "Filters" }).click()
    const panel = phone.getByRole("dialog", { name: "Filters" })
    await panel.getByRole("checkbox", { name: /Completed/ }).check()
    await panel.getByRole("button", { name: /^View/ }).click()
    await expect.poll(() => total(phone)).toBe(desktop)
    await phone.close()
  })
})

test.describe("Toolbar Labels on the fixtures page", () => {
  test("the Filters button and View N results are in Portuguese", async ({ page }) => {
    await page.goto("/fixtures")
    const people = page.getByRole("region", { name: "Pessoas", exact: true })
    await people.getByRole("button", { name: "Filtros" }).click()
    const panel = page.getByRole("dialog", { name: "Filtros" })
    await panel.getByRole("checkbox", { name: /Porto/ }).check()
    await expect(panel.getByRole("button", { name: "Ver 2 resultados" })).toBeVisible()
    await panel.getByRole("button", { name: "Ver 2 resultados" }).click()
    await expect(people.getByRole("button", { name: "Filtros (1)" })).toBeVisible()
  })
})
