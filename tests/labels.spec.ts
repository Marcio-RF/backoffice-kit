import { expect, test, type Page } from "@playwright/test"

const people = (page: Page) => page.getByRole("region", { name: "Pessoas", exact: true })

// Row selection and the table's cells only exist at md and up.
test.describe("Labels on the fixtures page (Portuguese)", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await page.goto("/fixtures")
    await expect(page.getByRole("heading", { name: "Fixtures de Rótulos" })).toBeVisible()
  })

  test("pagination range is shown in Portuguese", async ({ page }) => {
    await expect(people(page).getByRole("status")).toHaveText("1–3 de 8")
    await expect(people(page).getByRole("button", { name: "Página anterior" })).toBeVisible()
  })

  test("selected count is shown in Portuguese", async ({ page }) => {
    await people(page).getByRole("checkbox", { name: "Selecionar Ana" }).check()
    await expect(people(page).getByRole("status")).toContainText("1 de 8 selecionados")
  })

  test("empty state is shown in Portuguese", async ({ page }) => {
    await people(page).getByRole("searchbox", { name: "Pesquisar" }).fill("zzz")
    await expect(people(page).getByRole("cell", { name: "Sem resultados." })).toBeVisible()
  })

  test("labels that are not overridden keep their English defaults", async ({ page }) => {
    await expect(people(page).getByRole("button", { name: "Next page" })).toBeVisible()
  })
})
