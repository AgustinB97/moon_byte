import { test, expect } from '@playwright/test'

test.describe('Theme toggle (dark/light)', () => {
  // No usar addInitScript — corre en cada navegación incluyendo reload(),
  // y borraría el storage justo antes de que el inline <script> del head lo lea.
  // En su lugar, limpiar storage una vez por test después de cargar.
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('mb-theme'))
    await page.reload()
  })

  test('inicia en dark mode por defecto', async ({ page }) => {
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass ?? '').not.toContain('light')

    // Esperar a que la transition de bg termine (puede haber residuo de tests previos)
    await page.waitForTimeout(400)
    const bgColor = await page.locator('body').evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).toBe('rgb(11, 11, 13)') // #0b0b0d
  })

  test('toggle a light mode aplica clase y cambia background (desktop)', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 768, 'Toggle visible solo desktop por defecto')

    // Scope al navbar para evitar el toggle del mobile menu (que también existe en el DOM)
    const navToggle = page.getByRole('navigation').getByRole('button', { name: /activar modo claro/i })
    await navToggle.click()

    await expect(page.locator('html')).toHaveClass(/light/)

    // Esperar a que termine la transición de 300ms del bg-color
    await page.waitForTimeout(400)
    const bgColor = await page.locator('body').evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).toBe('rgb(244, 239, 230)') // #f4efe6
  })

  test('persistencia del tema tras reload (desktop)', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 768, 'Toggle visible solo desktop por defecto')

    await page.getByRole('navigation').getByRole('button', { name: /activar modo claro/i }).click()
    await expect(page.locator('html')).toHaveClass(/light/)

    await page.reload()

    await expect(page.locator('html')).toHaveClass(/light/)
    const stored = await page.evaluate(() => localStorage.getItem('mb-theme'))
    expect(stored).toContain('"theme":"light"')
  })

  test('toggle vuelve a dark mode (desktop)', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 768, 'Toggle visible solo desktop por defecto')

    const nav = page.getByRole('navigation')

    await nav.getByRole('button', { name: /activar modo claro/i }).click()
    await expect(page.locator('html')).toHaveClass(/light/)

    await nav.getByRole('button', { name: /activar modo oscuro/i }).click()
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass ?? '').not.toContain('light')
  })
})
