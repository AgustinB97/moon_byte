import { test, expect, type Page } from '@playwright/test'

// Helper: prepoblar carrito vía addInitScript (antes de hidratar Zustand)
async function seedCart(page: Page, items: { name: string; price: number; quantity: number }[]) {
  await page.addInitScript((seed) => {
    const products = seed.map((it, i) => ({
      product: {
        _id: `seed-${i}`,
        name: it.name,
        slug: `seed-${i}`,
        description: 'seeded',
        price: it.price,
        images: ['https://via.placeholder.com/300'],
        category: 'procesadores',
        brand: 'TEST',
        stock: 99,
        rating: 5,
        reviewCount: 0,
        tags: [],
        specs: {},
        featured: false,
        createdAt: new Date().toISOString(),
      },
      quantity: it.quantity,
    }))
    localStorage.setItem('ph-cart', JSON.stringify({
      state: { items: products, isOpen: false },
      version: 0,
    }))
  }, items)
}

test.describe('Carrito de compras', () => {
  test('estado inicial: badge no visible', async ({ page }) => {
    await page.goto('/')
    const cartBtn = page.getByRole('button', { name: /abrir carrito/i })
    await expect(cartBtn).toBeVisible()
    // No hay número de badge
    await expect(cartBtn.locator('span').filter({ hasText: /^\d+$/ })).toHaveCount(0)
  })

  test('agregar producto desde card actualiza badge', async ({ page }) => {
    await page.goto('/')

    // Buscar primera card en "Lo Más Vendido"
    const firstCard = page.locator('a[href^="/productos/"]').filter({ has: page.getByRole('button', { name: /agregar al carrito/i }) }).first()
    await firstCard.scrollIntoViewIfNeeded()
    await firstCard.hover()
    await firstCard.getByRole('button', { name: /agregar al carrito/i }).click()

    // Badge muestra 1
    const cartBtn = page.getByRole('button', { name: /abrir carrito/i })
    await expect(cartBtn.getByText('1')).toBeVisible()
  })

  test('drawer abre, muestra items y permite cambiar cantidad', async ({ page }) => {
    await seedCart(page, [{ name: 'Producto Seed', price: 100000, quantity: 1 }])
    await page.goto('/')

    // Badge ya muestra 1 desde el seed
    await expect(page.getByRole('button', { name: /abrir carrito/i }).getByText('1')).toBeVisible()

    // Abrir drawer
    await page.getByRole('button', { name: /abrir carrito/i }).click()

    const drawer = page.locator('aside').filter({ has: page.getByText(/^\[ carrito \]$/i) })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByText('Producto Seed')).toBeVisible()
    // El monto aparece en item + total — basta con verificar que existe
    await expect(drawer.getByText(/\$\s*100\.000/).first()).toBeVisible()

    // Click en el + para incrementar
    const plusBtn = drawer.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first()
    await plusBtn.click()

    // Total ahora $200.000
    await expect(drawer.getByText(/\$\s*200\.000/).first()).toBeVisible()

    // Badge actualizado a 2
    await expect(page.getByRole('button', { name: /abrir carrito/i }).getByText('2')).toBeVisible()
  })

  test('persistencia en localStorage tras reload', async ({ page }) => {
    await seedCart(page, [{ name: 'Persiste', price: 50000, quantity: 3 }])
    await page.goto('/')

    await expect(page.getByRole('button', { name: /abrir carrito/i }).getByText('3')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('button', { name: /abrir carrito/i }).getByText('3')).toBeVisible()
  })

  test('página /carrito muestra items y permite vaciar', async ({ page }) => {
    await seedCart(page, [{ name: 'Item A', price: 10000, quantity: 2 }])
    await page.goto('/carrito')

    await expect(page.getByRole('heading', { name: /tu selección/i })).toBeVisible()
    await expect(page.getByRole('main').getByText('Item A')).toBeVisible()

    // Vaciar carrito
    await page.getByRole('button', { name: /vaciar carrito/i }).click()

    // Empty state visible en <main> (scope por si está también en el drawer)
    await expect(page.getByRole('main').getByText(/carrito vacío/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /explorar catálogo/i })).toBeVisible()
  })

  test('carrito vacío en /carrito muestra empty state', async ({ page }) => {
    await page.goto('/carrito')
    await expect(page.getByRole('main').getByText(/carrito vacío/i)).toBeVisible()
    await expect(page.getByText(/todavía no agregaste/i)).toBeVisible()
  })
})
