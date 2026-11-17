import { expect, test } from "@playwright/test"

test.describe("Labels on the fixtures page (Portuguese)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fixtures")
    await expect(page.getByRole("heading", { name: "Fixtures de Rótulos" })).toBeVisible()
  })

  test("pagination range is shown in Portuguese", async ({ page }) => {
    await expect(page.getByRole("status")).toHaveText("1–3 de 8")
    await expect(page.getByRole("button", { name: "Página anterior" })).toBeVisible()
  })

  test("selected count is shown in Portuguese", async ({ page }) => {
    await page.getByRole("checkbox", { name: "Selecionar Ana" }).check()
    await expect(page.getByRole("status")).toContainText("1 de 8 selecionados")
  })

  test("empty state is shown in Portuguese", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Pesquisar" }).fill("zzz")
    await expect(page.getByRole("cell", { name: "Sem resultados." })).toBeVisible()
  })

  test("labels that are not overridden keep their English defaults", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Next page" })).toBeVisible()
  })
})
