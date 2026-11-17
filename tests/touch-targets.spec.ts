import { expect, test, type Page } from "@playwright/test"

const pages = [
  { name: "Overview", path: "/" },
  { name: "Orders", path: "/orders" },
  { name: "New order", path: "/orders/new" },
  { name: "Customers", path: "/customers" },
  { name: "Settings", path: "/settings" },
  { name: "Fixtures", path: "/fixtures" },
]

const INTERACTIVE =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="combobox"], [tabindex]:not([tabindex="-1"])'

// Measures every visible interactive element. An element passes when its box is
// at least 44x44, or when its ::after is an absolutely positioned 44x44 touch area.
async function undersizedTargets(page: Page) {
  return page.evaluate((selector) => {
    const MIN = 44
    const failures: string[] = []
    for (const el of document.querySelectorAll(selector)) {
      const style = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      if (style.visibility === "hidden" || style.display === "none") continue
      if (style.opacity === "0" || el.closest("[aria-hidden='true']")) continue
      if (rect.bottom < 0 || rect.right < 0) continue
      // Off-canvas (closed mobile sidebar) is not tappable.
      if (rect.right > window.innerWidth + 1 || rect.left < -1) continue
      // Skip links are only revealed on focus.
      if (el.matches("[data-slot='skip-link'], a[href^='#']")) continue
      // Inline links inside running text are exempt, as in WCAG 2.5.8.
      if (el.matches("a") && el.closest("p, li, td")) continue

      if (rect.width >= MIN - 0.5 && rect.height >= MIN - 0.5) continue

      const after = getComputedStyle(el, "::after")
      if (
        after.content !== "none" &&
        after.position === "absolute" &&
        parseFloat(after.width) >= MIN &&
        parseFloat(after.height) >= MIN
      )
        continue

      const label =
        el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 30) || ""
      failures.push(
        `<${el.tagName.toLowerCase()} data-slot="${el.getAttribute("data-slot")}"> "${label}" ${Math.round(rect.width)}x${Math.round(rect.height)}`
      )
    }
    return failures
  }, INTERACTIVE)
}

for (const { name, path } of pages) {
  test(`${name}: touch targets are at least 44px at 375px`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    expect(await undersizedTargets(page)).toEqual([])
  })

  test(`${name}: form fields compute to 16px or more at 375px`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("input:not([type='hidden']), textarea, select")]
        .filter((el) => {
          const rect = el.getBoundingClientRect()
          // Radix renders a hidden native <select> next to each Select.
          return rect.width > 0 && rect.height > 0 && !el.closest("[aria-hidden='true']")
        })
        .map((el) => ({
          slot: el.getAttribute("data-slot"),
          tag: el.tagName,
          type: el.getAttribute("type"),
          cls: el.className.toString().slice(0, 60),
          size: parseFloat(getComputedStyle(el).fontSize),
        }))
        .filter(({ size }) => size < 16)
    )
    expect(small).toEqual([])
  })
}

// Select triggers are buttons, not inputs, so the 16px rule must reach them too.
test("Select trigger text computes to 16px or more at 375px", async ({ page }) => {
  await page.goto("/orders/new")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll("[data-slot='select-trigger']")].map((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    )
  )
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16)
})

test.describe("desktop density is unchanged at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test("default button stays 32px tall", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll("[data-slot='button']")]
        .filter((el) => el.getBoundingClientRect().height > 0)
        .map((el) => Math.round(el.getBoundingClientRect().height))
    )
    expect(heights).toContain(32)
    expect(Math.max(...heights)).toBeLessThan(44)
  })
})
