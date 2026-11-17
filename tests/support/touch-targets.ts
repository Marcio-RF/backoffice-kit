import type { Page } from "@playwright/test"

const INTERACTIVE =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="combobox"], [tabindex]:not([tabindex="-1"])'

// Measures every visible interactive element. An element passes when its box is
// at least 44x44, or when its ::after is an absolutely positioned 44x44 touch area.
export async function undersizedTargets(page: Page) {
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
