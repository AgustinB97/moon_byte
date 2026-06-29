import { test, expect } from '@playwright/test'

test.describe('Navegación y Home', () => {
  test('home renderiza hero con CTAs y MoonByte branding', async ({ page }) => {
    await page.goto('/')

    // Scope al navbar (también está en el footer)
    await expect(page.getByRole('navigation').getByRole('link', { name: /moonbyte/i })).toBeVisible()

    // Hero title
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/pc armada/i)

    // CTAs principales
    await expect(page.getByRole('link', { name: /ver pcs armadas/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /explorar componentes/i })).toBeVisible()

    // Stats — exact:true para evitar match con "+500 Builds disponibles" / "Envío en 24hs"
    await expect(page.getByText('+500', { exact: true })).toBeVisible()
    await expect(page.getByText('24hs', { exact: true })).toBeVisible()
    await expect(page.getByText('12x', { exact: true })).toBeVisible()
  })

  test('telemetry panel muestra métricas live (desktop)', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 768, 'Solo en desktop')
    await page.goto('/')

    await expect(page.getByText(/telemetría live/i)).toBeVisible()
    await expect(page.getByText(/builds activas/i)).toBeVisible()
    await expect(page.getByText(/online now/i)).toBeVisible()
  })

  test('navega de home a productos via CTA', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /ver pcs armadas/i }).click()
    await expect(page).toHaveURL(/\/productos\?category=pcs-armadas/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/pcs armadas/i)
  })

  test('búsqueda redirige con query param (desktop)', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 768, 'Solo en desktop')
    await page.goto('/')

    const searchInput = page.getByPlaceholder(/buscar hardware/i).first()
    await searchInput.fill('rtx 4090')
    await searchInput.press('Enter')

    await expect(page).toHaveURL(/search=rtx%204090/)
  })

  test('marquee de specs renderizado', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('RTX 4090 24GB').first()).toBeVisible()
  })

  test('mobile menu se abre y muestra navegación', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) >= 768, 'Solo en mobile')
    await page.goto('/')

    await page.getByRole('button', { name: /menu/i }).click()

    // El overlay del menu mobile (h-display text 4xl distintivo de los links)
    const menuLink = page.locator('a.font-display').filter({ hasText: 'PCs Armadas' })
    await expect(menuLink).toBeVisible()
  })
})
