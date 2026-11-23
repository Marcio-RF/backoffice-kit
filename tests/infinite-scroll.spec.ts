import { expect, test, type Page } from "@playwright/test"

const loadedOf = async (page: Page) => {
  const text = await page.getByRole("status").innerText()
  const [, loaded, total] = text.match(/([\d,]+) of ([\d,]+) orders/)!
  return { loaded: Number(loaded.replace(/,/g, "")), total: Number(total.replace(/,/g, "")) }
}

for (const viewport of [
  { width: 375, height: 812 },
  { width: 1280, height: 800 },
]) {
  test.describe(`Orders infinite scroll at ${viewport.width}px`, () => {
    test.use({ viewport })

    test("shows the total on top and loads more while scrolling", async ({ page }) => {
      await page.goto("/orders")
      await expect(page.getByRole("status")).toHaveText("50 of 2,000 orders")
      await expect
        .poll(async () => {
          await page.mouse.wheel(0, 3000)
          return (await loadedOf(page)).loaded
        })
        .toBeGreaterThanOrEqual(150)
      expect((await loadedOf(page)).total).toBe(2000)
    })

    test("only the rows near the screen exist in the page", async ({ page }) => {
      await page.goto("/orders")
      await expect(page.getByRole("status")).toHaveText("50 of 2,000 orders")
      await expect
        .poll(async () => {
          await page.mouse.wheel(0, 4000)
          return (await loadedOf(page)).loaded
        })
        .toBeGreaterThanOrEqual(300)
      const form = viewport.width < 768 ? page.getByRole("list", { name: "Orders" }).getByRole("listitem") : page.getByRole("table", { name: "Orders" }).getByRole("row")
      expect(await form.count()).toBeLessThan(80)
    })
  })
}

test("a new search starts at the top with the new total", async ({ page }) => {
  await page.goto("/orders")
  await expect(page.getByRole("status")).toHaveText("50 of 2,000 orders")
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, 3000)
      return (await loadedOf(page)).loaded
    })
    .toBeGreaterThanOrEqual(150)
  await page.getByRole("searchbox", { name: "Search orders" }).fill("Ana")
  await expect.poll(async () => (await loadedOf(page)).total).toBeLessThan(2000)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(300)
  await expect(page.getByRole("searchbox", { name: "Search orders" })).toBeInViewport()
})
