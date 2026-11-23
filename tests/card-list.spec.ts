import { expect, test } from "@playwright/test"

test.describe("Orders at 375px shows the card list", () => {
  test("cards are visible and the table is not", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("list", { name: "Orders" })).toBeVisible()
    await expect(page.getByRole("table", { name: "Orders" })).toBeHidden()
  })

  test("a card puts title and status on the first line, subtitle and value on the second", async ({ page }) => {
    await page.goto("/orders")
    const card = page.getByRole("list", { name: "Orders" }).getByRole("listitem").first()
    const title = card.locator("[data-slot='card-title']")
    const status = card.locator("[data-slot='card-status']")
    const subtitle = card.locator("[data-slot='card-subtitle']")
    const value = card.locator("[data-slot='card-value']")
    const [t, s, st, v] = await Promise.all([title, status, subtitle, value].map((l) => l.boundingBox()))
    expect(t!.y).toBeLessThan(st!.y)
    expect(Math.abs(t!.y - s!.y)).toBeLessThan(12)
    expect(Math.abs(st!.y - v!.y)).toBeLessThan(12)
    expect(s!.x).toBeGreaterThan(t!.x)
    expect(v!.x).toBeGreaterThan(st!.x)
    await expect(subtitle).toContainText("ORD-")
    await expect(value).toHaveClass(/tabular-nums/)
  })

  test("cards have no checkbox and no actions menu", async ({ page }) => {
    await page.goto("/orders")
    const list = page.getByRole("list", { name: "Orders" })
    await expect(list.getByRole("checkbox")).toHaveCount(0)
    await expect(list.getByRole("button", { name: /^Actions for/ })).toHaveCount(0)
  })

  test("the card is a single link named after its title", async ({ page }) => {
    await page.goto("/orders")
    const card = page.getByRole("list", { name: "Orders" }).getByRole("listitem").first()
    const name = (await card.locator("[data-slot='card-title']").innerText()).split("\n")[0]
    await expect(card.getByRole("link")).toHaveCount(1)
    await expect(card.getByRole("link", { name })).toBeVisible()
  })

  test("tapping a card opens the detail", async ({ page }) => {
    await page.goto("/orders")
    const card = page.getByRole("list", { name: "Orders" }).getByRole("listitem").first()
    const id = (await card.locator("[data-slot='card-subtitle']").innerText()).match(/ORD-\d+/)![0]
    await card.getByRole("link").click()
    await expect(page.getByRole("dialog")).toContainText(id)
  })

  test("search filters the cards", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("searchbox", { name: "Search orders" }).fill("zzzz")
    await expect(page.getByRole("list", { name: "Orders" })).toContainText("No results.")
  })
})

test.describe("Orders at 1280px shows the table", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test("table is visible and the cards are not", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("table", { name: "Orders" })).toBeVisible()
    await expect(page.getByRole("list", { name: "Orders" })).toBeHidden()
  })
})

test.describe("Fixture without slots", () => {
  test("the first column with data becomes the title", async ({ page }) => {
    await page.goto("/fixtures")
    const list = page.getByRole("list", { name: "Pessoas sem slots" })
    const first = list.getByRole("listitem").first()
    await expect(first.locator("[data-slot='card-title']")).toHaveText("Ana")
    await expect(first.locator("[data-slot='card-subtitle']")).toHaveCount(0)
    await expect(first).not.toContainText("Lisboa")
    await expect(first.getByRole("checkbox")).toHaveCount(0)
  })
})
