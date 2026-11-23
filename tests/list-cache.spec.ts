import { expect, test, type Page } from "@playwright/test"

test.use({ viewport: { width: 1280, height: 800 } })

/** Counts the list's page requests (server actions are POSTs). */
function countPageRequests(page: Page) {
  const counter = { n: 0 }
  page.on("request", (r) => {
    if (r.method() === "POST" && r.headers()["next-action"]) counter.n++
  })
  return counter
}

/** Href of the first record row whose bottom is below the top of the viewport. */
const firstVisible = (page: Page) =>
  page.evaluate(() => {
    for (const tr of document.querySelectorAll<HTMLElement>("table tbody > tr[data-index]")) {
      if (tr.getBoundingClientRect().bottom > 0) return tr.querySelector("a[href]")?.getAttribute("href") ?? null
    }
    return null
  })

const firstIndex = (page: Page) =>
  page.evaluate(() => {
    for (const tr of document.querySelectorAll<HTMLElement>("table tbody > tr[data-index]")) {
      if (tr.getBoundingClientRect().bottom > 0) return Number(tr.dataset.index)
    }
    return -1
  })

test("leaving by the sidebar and coming back restores the pages and the scroll, without new requests", async ({
  page,
}) => {
  await page.goto("/orders")
  await expect(page.getByRole("status")).toHaveText(/^50 of [\d,]+ orders$/)
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, 1500)
      return firstIndex(page)
    }, { timeout: 20_000 })
    .toBeGreaterThanOrEqual(180)
  await page.waitForLoadState("networkidle")
  await expect(page.locator("table[aria-busy]")).toHaveCount(0)
  await page.waitForTimeout(300)
  const before = await firstVisible(page)
  const loaded = await page.getByRole("status").innerText()

  await page.getByRole("link", { name: "Customers", exact: true }).click()
  await expect(page).toHaveURL(/\/customers$/)
  const requests = countPageRequests(page)
  await page.getByRole("link", { name: "Orders", exact: true }).click()
  await expect(page).toHaveURL(/\/orders$/)
  await expect(page.getByRole("status")).toHaveText(loaded)
  await expect.poll(() => firstVisible(page)).toBe(before)
  expect(requests.n).toBe(0)
})

test("F5 keeps only the filters and starts from the top", async ({ page }) => {
  await page.goto("/orders?status=completed")
  await expect(page.getByRole("status")).toHaveText(/^50 of [\d,]+ orders$/)
  await page.mouse.wheel(0, 3000)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)
  await page.reload()
  await expect(page.getByRole("status")).toHaveText(/^50 of [\d,]+ orders$/)
  await expect(page.getByRole("button", { name: /^Status/ })).toContainText("Completed")
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50)
})

test("the cache keeps only the last five lists", async ({ page }) => {
  const queries = ["status=pending", "status=confirmed", "status=in_progress", "status=completed", "status=cancelled", "channel=Phone"]
  await page.goto("/fixtures/links")
  for (const q of queries) {
    await page.getByRole("link", { name: q }).click()
    await expect(page).toHaveURL((url) => url.pathname === "/orders" && url.search === `?${q}`)
    await expect(page.getByRole("status")).toHaveText(/^50 of [\d,]+ orders$/)
    // The first page of this query, not the previous list still on screen while it loads.
    await page.waitForLoadState("networkidle")
    await expect(page.locator("table[aria-busy]")).toHaveCount(0)
    await page.goBack()
    await expect(page.getByRole("heading", { name: "Fixtures de links" })).toBeVisible()
  }
  const requests = countPageRequests(page)
  // The second list is still cached…
  await page.getByRole("link", { name: queries[1] }).click()
  await expect(page.getByRole("status")).toHaveText(/^50 of [\d,]+ orders$/)
  expect(requests.n).toBe(0)
  await page.goBack()
  // …the first one was dropped when the sixth came in.
  await page.getByRole("link", { name: queries[0] }).click()
  await expect(page.getByRole("status")).toHaveText(/^50 of [\d,]+ orders$/)
  await expect.poll(() => requests.n).toBeGreaterThan(0)
})
