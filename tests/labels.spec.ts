import { expect, test, type Page } from "@playwright/test"

const people = (page: Page) => page.getByRole("region", { name: "Pessoas", exact: true })

// Row selection and the table's cells only exist at md and up.
test.describe("Labels on the fixtures page (Portuguese)", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await page.goto("/fixtures")
    await expect(page.getByRole("heading", { name: "Fixtures de Rótulos" })).toBeVisible()
  })

  test("the total on top is shown in Portuguese", async ({ page }) => {
    await expect(people(page).getByRole("status")).toHaveText("8 de 8 pessoas")
  })

  test("selected count is shown in Portuguese", async ({ page }) => {
    await people(page).getByRole("checkbox", { name: "Selecionar Ana" }).check()
    await expect(people(page).getByRole("status")).toContainText("1 selecionados")
  })

  test("empty state is shown in Portuguese", async ({ page }) => {
    await people(page).getByRole("searchbox", { name: "Pesquisar" }).fill("zzz")
    await expect(people(page).getByRole("cell", { name: "Sem resultados." })).toBeVisible()
  })

  test("a failed page shows the error in Portuguese, and the label left undefined keeps its default", async ({ page }) => {
    const region = page.getByRole("region", { name: "Registos" })
    await region.scrollIntoViewIfNeeded()
    await expect(region.getByRole("status")).toHaveText("40 de 300 registos")
    // Scroll until the third page is requested; it fails once.
    await expect
      .poll(async () => {
        await page.mouse.wheel(0, 2000)
        return region.getByText("Não foi possível carregar mais.").filter({ visible: true }).isVisible()
      })
      .toBe(true)
    await region.getByRole("button", { name: "Retry" }).click()
    await expect(region.getByRole("status")).toHaveText(/^(120|160|200|240|280|300) de 300 registos$/)
  })
})
