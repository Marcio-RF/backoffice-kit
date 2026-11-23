import { expect, test, type Page } from "@playwright/test"

import { undersizedTargets } from "./support/touch-targets"

const cards = (page: Page) => page.getByRole("list", { name: "Orders" }).getByRole("link")

/** Opens the n-th card and returns its href. */
async function openCard(page: Page, n = 2) {
  await page.goto("/orders")
  await expect(page.getByRole("status")).toHaveText("50 of 2,000 orders")
  const card = cards(page).nth(n)
  const href = (await card.getAttribute("href"))!
  await card.click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(page.getByRole("dialog")).toBeVisible()
  return href
}

test.describe("Dialog roteado at 375px", () => {
  test("tapping a card opens the Detail over the whole viewport, with its own URL", async ({ page }) => {
    const href = await openCard(page)
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText(href.split("/").pop()!)
    const box = await dialog.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, top: r.top, width: r.width, height: r.height, vw: innerWidth, vh: innerHeight }
    })
    expect(box.left).toBeCloseTo(0, 0)
    expect(box.top).toBeCloseTo(0, 0)
    expect(box.width).toBeCloseTo(box.vw, 0)
    expect(box.height).toBeCloseTo(box.vh, 0)
  })

  test("focus goes to the title, and back to the card on close", async ({ page }) => {
    const href = await openCard(page)
    await expect(page.getByRole("dialog").getByRole("heading", { level: 2 })).toBeFocused()
    await page.getByRole("dialog").getByRole("button", { name: "Close" }).click()
    await expect(page.getByRole("dialog")).toBeHidden()
    await expect(page.locator(`a[href="${href}"]:visible`)).toBeFocused()
  })

  test("the footer offers the actions of the row menu", async ({ page }) => {
    await openCard(page)
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("button", { name: "Copy order ID" })).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Cancel order" })).toBeVisible()
  })

  test("check:mobile: touch targets are 44px and nothing scrolls sideways with the dialog open", async ({ page }) => {
    await openCard(page)
    expect(await undersizedTargets(page)).toEqual([])
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })

  for (const how of ["Close button", "Escape", "browser back", "swipe down"] as const) {
    test(`${how} closes the dialog and keeps the list where it was`, async ({ page }) => {
      await page.goto("/orders")
      await expect(page.getByRole("status")).toHaveText("50 of 2,000 orders")
      await page.mouse.wheel(0, 900)
      await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(500)
      const before = await page.evaluate(() => Math.round(window.scrollY))
      const card = cards(page).nth(12)
      await card.click()
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      if (how === "Close button") await dialog.getByRole("button", { name: "Close" }).click()
      if (how === "Escape") await page.keyboard.press("Escape")
      if (how === "browser back") await page.goBack()
      if (how === "swipe down")
        await page.locator("[data-slot='routed-dialog-header']").evaluate((header) => {
          const touch = (y: number) => new Touch({ identifier: 1, target: header, clientX: 100, clientY: y })
          const fire = (type: string, y: number) =>
            header.dispatchEvent(
              new TouchEvent(type, {
                bubbles: true,
                cancelable: true,
                touches: type === "touchend" ? [] : [touch(y)],
                changedTouches: [touch(y)],
              }),
            )
          fire("touchstart", 60)
          fire("touchmove", 200)
          fire("touchmove", 500)
          fire("touchend", 500)
        })
      await expect(dialog).toBeHidden()
      await expect(page).toHaveURL(/\/orders$/)
      expect(Math.abs((await page.evaluate(() => Math.round(window.scrollY))) - before)).toBeLessThan(2)
    })
  }

  test("opening the URL directly shows the full page with the same title", async ({ page }) => {
    const href = await openCard(page)
    const title = await page.getByRole("dialog").getByRole("heading", { level: 2 }).innerText()
    await page.reload()
    await expect(page.getByRole("dialog")).toBeHidden()
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible()
    await expect(page.getByRole("button", { name: "Copy order ID" })).toBeVisible()
    await page.getByRole("link", { name: "Back" }).click()
    await expect(page).toHaveURL(/\/orders$/)
    expect(href).toContain("/orders/")
  })
})

test.describe("Dialog roteado at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test("clicking a row opens a centred panel over the dimmed list", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("status")).toHaveText("50 of 2,000 orders")
    await page.getByRole("table", { name: "Orders" }).getByRole("row").nth(3).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    const box = await dialog.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right, width: r.width, vw: innerWidth }
    })
    expect(box.width).toBeLessThan(box.vw)
    expect(Math.abs(box.left - (box.vw - box.right))).toBeLessThan(2)
    await expect(page.locator("[data-slot='routed-dialog-backdrop']")).toBeVisible()
    // The list is still there behind the dialog, out of reach.
    await expect(page.locator("table")).toHaveCount(1)
    expect(await page.locator("#main").evaluate((el) => !!el.closest("[inert]"))).toBe(true)
  })

  test("clicking outside closes the dialog", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("status")).toHaveText("50 of 2,000 orders")
    await page.getByRole("table", { name: "Orders" }).getByRole("row").nth(3).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.mouse.click(20, 400)
    await expect(page.getByRole("dialog")).toBeHidden()
    await expect(page).toHaveURL(/\/orders$/)
  })

  test("navigating with the sidebar closes the dialog", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("table", { name: "Orders" }).getByRole("row").nth(3).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    // The sidebar is behind the dialog: use the browser to go there, as a sidebar link does.
    await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>("a[href='/customers']")!
      link.closest("[inert]")?.removeAttribute("inert")
      link.click()
    })
    await expect(page).toHaveURL(/\/customers$/)
    await expect(page.getByRole("dialog")).toBeHidden()
  })
})

test.describe("Navigating inside the Dialog roteado", () => {
  test("Order → Customer swaps the content in the same frame; ← goes back one step, × to the list", async ({ page }) => {
    await openCard(page)
    const dialog = page.getByRole("dialog")
    const orderTitle = await dialog.getByRole("heading", { level: 2 }).innerText()
    await dialog.getByRole("link", { name: orderTitle }).click()
    await expect(page).toHaveURL(/\/customers\//)
    await expect(dialog.getByText("Recent orders")).toBeVisible()
    await expect(page.getByRole("dialog")).toHaveCount(1)
    await dialog.getByRole("button", { name: "Back" }).click()
    await expect(page).toHaveURL(/\/orders\/ORD-/)
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(orderTitle)

    await dialog.getByRole("link", { name: orderTitle }).click()
    await expect(page).toHaveURL(/\/customers\//)
    await dialog.getByRole("link", { name: /ORD-/ }).nth(1).click()
    await expect(page).toHaveURL(/\/orders\/ORD-/)
    await expect(dialog.getByRole("button", { name: "Back" })).toBeVisible()
    await dialog.getByRole("button", { name: "Close" }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/orders$/)
  })

  test("the browser's back goes one step back inside the dialog", async ({ page }) => {
    await openCard(page)
    const dialog = page.getByRole("dialog")
    const orderTitle = await dialog.getByRole("heading", { level: 2 }).innerText()
    await dialog.getByRole("link", { name: orderTitle }).click()
    await expect(page).toHaveURL(/\/customers\//)
    await page.goBack()
    await expect(page).toHaveURL(/\/orders\/ORD-/)
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(orderTitle)
    await expect(dialog.getByRole("button", { name: "Back" })).toBeHidden()
  })

  test("a customer opened directly is a full page", async ({ page }) => {
    await page.goto("/customers/ana.devries")
    await expect(page.getByRole("dialog")).toBeHidden()
    await expect(page.getByRole("heading", { level: 1, name: "Ana de Vries" })).toBeVisible()
  })
})

test.describe("A Fluxo móvel in the Dialog roteado", () => {
  test("Quick order opens over the list with its own bar, and its back closes the dialog", async ({ page }) => {
    await page.goto("/orders")
    await page.getByRole("link", { name: "Quick order" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(/\/quick-order$/)
    await expect(dialog.getByRole("heading", { level: 1, name: "Choose customer" })).toBeFocused()
    await expect(dialog.getByRole("button", { name: "Close" })).toHaveCount(0)
    const box = await dialog.evaluate((el) => el.getBoundingClientRect().height)
    expect(box).toBeCloseTo(812, 0)
    await dialog.getByRole("button", { name: "Back" }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/orders$/)
  })
})
